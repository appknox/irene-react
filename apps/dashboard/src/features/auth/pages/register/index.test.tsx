import { faker } from '@faker-js/faker';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { ConfigurationEndpoints } from '@irene/api/services/configuration/endpoints';
import { RegistrationEndpoints } from '@irene/api/services/registration/endpoints';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';

import { buildFrontendConfiguration } from '@tests/factories';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

/*
  The widget's script never loads in a test environment, so the real hook hands
  back no `executeRecaptcha` and the page sends its disabled placeholder. Held
  here so a test can put a score in its place.
*/
const recaptcha: { score?: string } = {};

vi.mock('react-google-recaptcha-v3', () => ({
  GoogleReCaptchaProvider: ({ children }: { children: ReactNode }) => children,
  useGoogleReCaptcha: () => ({
    executeRecaptcha: recaptcha.score ? () => Promise.resolve(recaptcha.score) : undefined,
  }),
}));

const registrationUrl = buildAPITestURL(RegistrationEndpoints.register());

const EMAIL = faker.internet.email();
const COMPANY = faker.company.name();

/** Fills the form in and submits it. */
const emailField = () => screen.getByLabelText(akMT('emailId'));
const companyField = () => screen.getByLabelText(akMT('companyName'));

/** Fills the form in and submits it. */
async function register({ email = EMAIL, company = COMPANY } = {}) {
  await userEvent.type(emailField(), email);
  await userEvent.type(companyField(), company);
  await userEvent.click(screen.getByRole('button', { name: akMT('register') }));
}

/** Answers the registration request with a field error, as the API reports one. */
const registrationFailsWith = (body: Record<string, string[]>) => {
  server.use(
    http.post(registrationUrl, () =>
      HttpResponse.json(body, { status: HTTP_STATUS_CODES.BAD_REQUEST })
    )
  );
};

describe('RegisterPage', () => {
  beforeEach(() => {
    server.use(http.post(registrationUrl, () => new HttpResponse(null, { status: 204 })));
  });

  afterEach(() => {
    delete recaptcha.score;
  });

  it('posts the token the reCAPTCHA widget issued', async () => {
    recaptcha.score = 'recaptcha-score-token';

    let sent: Record<string, string> | undefined;

    server.use(
      http.post(registrationUrl, async ({ request }) => {
        sent = (await request.json()) as Record<string, string>;

        return new HttpResponse(null, { status: 204 });
      })
    );

    await renderAtRoute('/register');
    await register();

    await waitFor(() => expect(sent?.recaptcha).toBe('recaptcha-score-token'));
  });

  it('renders the email and company fields', async () => {
    await renderAtRoute('/register');

    expect(await screen.findByLabelText(akMT('emailId'))).toBeInTheDocument();
    expect(companyField()).toBeInTheDocument();
    expect(companyField()).toHaveAttribute('placeholder', akMT('companyName'));
    expect(screen.getByRole('button', { name: akMT('register') })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: akMT('register') })).toBeEnabled();
  });

  it('posts email, company and the reCAPTCHA token', async () => {
    let sent: Record<string, string> | undefined;

    server.use(
      http.post(registrationUrl, async ({ request }) => {
        sent = (await request.json()) as Record<string, string>;

        return new HttpResponse(null, { status: 204 });
      })
    );

    await renderAtRoute('/register');
    await register();

    await waitFor(() => expect(sent).toBeDefined());

    expect(sent).toEqual({
      email: EMAIL,
      company: COMPANY,
      first_name: '',
      last_name: '',
      recaptcha: 'notenabled',
    });
  });

  it('renders the check-your-email confirmation once registration succeeds', async () => {
    await renderAtRoute('/register');
    await register();

    expect(await screen.findByText(akMT('registerConfirmation'))).toBeInTheDocument();
    expect(screen.getByText(akMT('checkEmail'))).toBeInTheDocument();
  });

  it('rejects a value that is not an email address', async () => {
    await renderAtRoute('/register');
    await register({ email: 'not-an-address' });

    expect(await screen.findByText(akMT('invalidEmailAddress'))).toBeInTheDocument();
  });

  it('rejects an empty company field', async () => {
    await renderAtRoute('/register');

    await userEvent.type(emailField(), EMAIL);
    await userEvent.click(screen.getByRole('button', { name: akMT('register') }));

    expect(await screen.findByText(akMT('companyNameRequired'))).toBeInTheDocument();
  });

  it("renders the API's error on the field it names", async () => {
    registrationFailsWith({ email: ['This email is already registered.'] });

    await renderAtRoute('/register');
    await register();

    expect(await screen.findByText('This email is already registered.')).toBeInTheDocument();
  });

  it('renders a notification when the API refuses the reCAPTCHA token', async () => {
    registrationFailsWith({ recaptcha: ['Error verifying reCAPTCHA, please try again.'] });

    await renderAtRoute('/register');
    await register();

    expect(
      await screen.findByText('Error verifying reCAPTCHA, please try again.')
    ).toBeInTheDocument();
  });

  it('renders a notification when the deployment has registration disabled', async () => {
    server.use(
      http.post(registrationUrl, () =>
        HttpResponse.json({ detail: 'Not found.' }, { status: HTTP_STATUS_CODES.NOT_FOUND })
      )
    );

    await renderAtRoute('/register');
    await register();

    expect(await screen.findByText(akMT('somethingWentWrong'))).toBeInTheDocument();
  });

  it('renders a notification when the register request fails with no field errors', async () => {
    server.use(
      http.post(registrationUrl, () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    await renderAtRoute('/register');
    await register();

    expect(await screen.findByText(akMT('somethingWentWrong'))).toBeInTheDocument();
  });

  describe('a deployment with an external registration link', () => {
    let assignedHref: string | undefined;

    beforeEach(() => {
      assignedHref = undefined;

      vi.spyOn(window, 'location', 'get').mockReturnValue({
        ...window.location,
        set href(value: string) {
          assignedHref = value;
        },
        get href() {
          return 'https://dashboard.example.test/register';
        },
      } as Location);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('navigates to the registration link the configuration names', async () => {
      server.use(
        http.get(buildAPITestURL(ConfigurationEndpoints.frontend()), () =>
          HttpResponse.json(
            buildFrontendConfiguration({ registration_link: 'https://signup.example.test' })
          )
        )
      );

      await renderAtRoute('/register');

      expect(assignedHref).toBe('https://signup.example.test');
    });
  });
});
