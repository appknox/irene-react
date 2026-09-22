import { faker } from '@faker-js/faker';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfigurationEndpoints } from '@irene/api/services/configuration/endpoints';
import { RegistrationEndpoints } from '@irene/api/services/registration/endpoints';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';

import { buildFrontendConfiguration } from '@tests/factories';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

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

  it('renders the email and company fields', async () => {
    await renderAtRoute('/register');

    expect(await screen.findByLabelText(akMT('emailId'))).toBeInTheDocument();
    expect(companyField()).toBeInTheDocument();
    expect(companyField()).toHaveAttribute('placeholder', akMT('companyName'));
    expect(screen.getByRole('button', { name: akMT('register') })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: akMT('register') })).toBeEnabled();
  });

  it('sends the address, the company and a reCAPTCHA token', async () => {
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

  it('tells the user to read their email once the account is registered', async () => {
    await renderAtRoute('/register');
    await register();

    expect(await screen.findByText(akMT('registerConfirmation'))).toBeInTheDocument();
    expect(screen.getByText(akMT('checkEmail'))).toBeInTheDocument();
  });

  it('rejects an address that is not one', async () => {
    await renderAtRoute('/register');
    await register({ email: 'not-an-address' });

    expect(await screen.findByText(akMT('invalidEmailAddress'))).toBeInTheDocument();
  });

  it('rejects a blank company', async () => {
    await renderAtRoute('/register');

    await userEvent.type(emailField(), EMAIL);
    await userEvent.click(screen.getByRole('button', { name: akMT('register') }));

    expect(await screen.findByText(akMT('companyNameRequired'))).toBeInTheDocument();
  });

  it("renders the API's own message against the field it names", async () => {
    registrationFailsWith({ email: ['This email is already registered.'] });

    await renderAtRoute('/register');
    await register();

    expect(await screen.findByText('This email is already registered.')).toBeInTheDocument();
  });

  it('raises a notification when the reCAPTCHA check fails', async () => {
    registrationFailsWith({ recaptcha: ['Error verifying reCAPTCHA, please try again.'] });

    await renderAtRoute('/register');
    await register();

    expect(
      await screen.findByText('Error verifying reCAPTCHA, please try again.')
    ).toBeInTheDocument();
  });

  it('raises a notification when the deployment registers nobody', async () => {
    server.use(
      http.post(registrationUrl, () =>
        HttpResponse.json({ detail: 'Not found.' }, { status: HTTP_STATUS_CODES.NOT_FOUND })
      )
    );

    await renderAtRoute('/register');
    await register();

    expect(await screen.findByText(akMT('somethingWentWrong'))).toBeInTheDocument();
  });

  it('raises a notification when the request fails for no stated reason', async () => {
    server.use(
      http.post(registrationUrl, () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    await renderAtRoute('/register');
    await register();

    expect(await screen.findByText(akMT('somethingWentWrong'))).toBeInTheDocument();
  });

  describe('a deployment that registers people elsewhere', () => {
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

    it('sends the browser to the registration link it names', async () => {
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
