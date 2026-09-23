import { faker } from '@faker-js/faker';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { RegistrationEndpoints } from '@irene/api/services/registration/endpoints';
import { getStoredSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';

import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const inviteUrl = buildAPITestURL(RegistrationEndpoints.invite());

const TOKEN = 'signed-invitation-token';

const INVITED = {
  email: faker.internet.email(),
  company: faker.company.name(),
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
};

const USERNAME = faker.internet.username().toLowerCase();
const PASSWORD = 'correct horse battery staple';

/** Answers the invitation read with what it knows about the person. */
const invitationIs = (invited = INVITED) => {
  server.use(http.get(inviteUrl, () => HttpResponse.json(invited)));
};

/** Answers the invitation read as the API does for a spent or unknown token. */
const invitationIsInvalid = () => {
  server.use(
    http.get(inviteUrl, () =>
      HttpResponse.json({ token: ['Invalid Token'] }, { status: HTTP_STATUS_CODES.BAD_REQUEST })
    )
  );
};

/** Answers the registration with a field error, as the API reports one. */
const registrationFailsWith = (body: Record<string, string[]>) => {
  server.use(
    http.post(inviteUrl, () => HttpResponse.json(body, { status: HTTP_STATUS_CODES.BAD_REQUEST }))
  );
};

const usernameField = () => screen.getByLabelText(akMT('username'));
const passwordField = () => screen.getByLabelText(akMT('password'));
const confirmPasswordField = () => screen.getByLabelText(akMT('confirmPassword'));
const termsCheckbox = () => screen.getByRole('checkbox');
const submitButton = () => screen.getByRole('button', { name: akMT('register') });

/** Fills in everything the invitation does not already know, and submits. */
async function redeemInvitation({
  username = USERNAME,
  password = PASSWORD,
  confirmPassword = PASSWORD,
  acceptTerms = true,
} = {}) {
  await userEvent.type(usernameField(), username);
  await userEvent.type(passwordField(), password);
  await userEvent.type(confirmPasswordField(), confirmPassword);

  if (acceptTerms) {
    await userEvent.click(termsCheckbox());
  }

  await userEvent.click(submitButton());
}

/** Opens the page with the invitation already answered. */
const openInvitation = () => renderAtRoute(`/register-via-invite/${TOKEN}`);

describe('RegisterViaInvitePage', () => {
  beforeEach(() => {
    invitationIs();

    server.use(
      http.post(inviteUrl, () => HttpResponse.json({ token: 'session-token', user_id: 42 }))
    );
  });

  it('renders the invited address, which cannot be changed', async () => {
    await openInvitation();

    const email = await screen.findByLabelText(akMT('emailId'));

    expect(email).toHaveValue(INVITED.email);
    expect(email).toBeDisabled();
  });

  it('fills the name the invitation already knows', async () => {
    await openInvitation();

    expect(await screen.findByLabelText(akMT('firstName'))).toHaveValue(INVITED.first_name);
    expect(screen.getByLabelText(akMT('lastName'))).toHaveValue(INVITED.last_name);
  });

  it('renders the invited company, which cannot be changed', async () => {
    await openInvitation();

    const company = await screen.findByLabelText(akMT('companyName'));

    expect(company).toHaveValue(INVITED.company);
    expect(company).toBeDisabled();
  });

  it('asks for a company when the invitation names none', async () => {
    invitationIs({ ...INVITED, company: '' });

    await openInvitation();

    const company = await screen.findByLabelText(akMT('companyName'));

    expect(company).toBeEnabled();
    expect(company).toHaveValue('');
  });

  it('renders no way back to the login page', async () => {
    await openInvitation();

    await screen.findByLabelText(akMT('username'));

    expect(screen.queryByRole('link', { name: akMT('login') })).not.toBeInTheDocument();
  });

  it('sends the token, the account and the accepted terms', async () => {
    let sent: Record<string, unknown> | undefined;

    server.use(
      http.post(inviteUrl, async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json({ token: 'session-token', user_id: 42 });
      })
    );

    await openInvitation();
    await screen.findByLabelText(akMT('username'));
    await redeemInvitation();

    await waitFor(() => expect(sent).toBeDefined());

    expect(sent).toEqual({
      token: TOKEN,
      username: USERNAME,
      password: PASSWORD,
      confirm_password: PASSWORD,
      company: INVITED.company,
      first_name: INVITED.first_name,
      last_name: INVITED.last_name,
      terms_accepted: true,
    });
  });

  it('stores the session the API answers with', async () => {
    await openInvitation();
    await screen.findByLabelText(akMT('username'));
    await redeemInvitation();

    await waitFor(() =>
      expect(getStoredSession()).toEqual({
        userId: 42,
        token: 'session-token',
        b64token: expect.any(String),
      })
    );
  });

  it('says so when the invitation is spent or unknown', async () => {
    invitationIsInvalid();

    await openInvitation();

    expect(await screen.findByText(akMT('somethingWentWrong'))).toBeInTheDocument();
    expect(screen.getByText(/landed on an invalid page/)).toBeInTheDocument();
    expect(screen.queryByLabelText(akMT('username'))).not.toBeInTheDocument();
  });

  it('rejects a username shorter than three characters', async () => {
    await openInvitation();
    await screen.findByLabelText(akMT('username'));
    await redeemInvitation({ username: 'ab' });

    expect(await screen.findByText(akMT('usernameMinLengthError'))).toBeInTheDocument();
  });

  it('rejects a password shorter than ten characters', async () => {
    await openInvitation();
    await screen.findByLabelText(akMT('username'));
    await redeemInvitation({ password: 'short', confirmPassword: 'short' });

    expect(await screen.findByText(akMT('passwordMinLengthError'))).toBeInTheDocument();
  });

  it('rejects a confirmation that does not match', async () => {
    await openInvitation();
    await screen.findByLabelText(akMT('username'));
    await redeemInvitation({ confirmPassword: 'something else entirely' });

    expect(await screen.findByText(akMT('passwordMatchError'))).toBeInTheDocument();
  });

  it('rejects the form until the terms are accepted', async () => {
    await openInvitation();
    await screen.findByLabelText(akMT('username'));
    await redeemInvitation({ acceptTerms: false });

    expect(await screen.findByText(akMT('acceptTermsError'))).toBeInTheDocument();
  });

  it('clears a complaint as the field is corrected', async () => {
    await openInvitation();
    await screen.findByLabelText(akMT('username'));
    await redeemInvitation({ username: 'ab' });

    expect(await screen.findByText(akMT('usernameMinLengthError'))).toBeInTheDocument();

    await userEvent.type(usernameField(), 'c');

    await waitFor(() =>
      expect(screen.queryByText(akMT('usernameMinLengthError'))).not.toBeInTheDocument()
    );
  });

  it("renders the API's own message against the field it names", async () => {
    registrationFailsWith({ username: ['Username already exists'] });

    await openInvitation();
    await screen.findByLabelText(akMT('username'));
    await redeemInvitation();

    expect(await screen.findByText('Username already exists')).toBeInTheDocument();
  });

  it('raises a notification when the request fails for no stated reason', async () => {
    server.use(
      http.post(inviteUrl, () =>
        HttpResponse.json(
          { detail: 'Server error' },
          { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR }
        )
      )
    );

    await openInvitation();
    await screen.findByLabelText(akMT('username'));
    await redeemInvitation();

    expect(await screen.findByText(akMT('somethingWentWrong'))).toBeInTheDocument();
  });
});
