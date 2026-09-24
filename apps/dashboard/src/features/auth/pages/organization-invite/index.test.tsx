import { faker } from '@faker-js/faker';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { RegistrationEndpoints } from '@irene/api/services/registration/endpoints';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';
import type { ApiOrganizationInvitation } from '@irene/api/services/registration';

import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const TOKEN = faker.string.uuid();
const inviteUrl = buildAPITestURL(RegistrationEndpoints.organizationInvite(TOKEN));

const INVITATION: ApiOrganizationInvitation = {
  token: TOKEN,
  email: faker.internet.email(),
  company: faker.company.name(),
  is_sso_enforced: false,
};

const FIRST_NAME = faker.person.firstName();
const LAST_NAME = faker.person.lastName();
const USERNAME = faker.internet.username().toLowerCase();
const PASSWORD = 'correct horse battery staple';

/** Answers the invitation read with what the organization recorded. */
const invitationIs = (invitation: Partial<ApiOrganizationInvitation> = {}) => {
  server.use(http.get(inviteUrl, () => HttpResponse.json({ ...INVITATION, ...invitation })));
};

/** Answers the read the way the API does for a malformed, unknown or spent token. */
const invitationIsGone = () => {
  server.use(
    http.get(inviteUrl, () =>
      HttpResponse.json({ detail: 'Not found.' }, { status: HTTP_STATUS_CODES.NOT_FOUND })
    )
  );
};

/** Answers the acceptance the way the API does for a field it refuses. */
const acceptanceFailsWith = (
  body: Record<string, string[]>,
  status: number = HTTP_STATUS_CODES.BAD_REQUEST
) => {
  server.use(http.post(inviteUrl, () => HttpResponse.json(body, { status })));
};

const firstNameField = () => screen.getByLabelText(akMT('firstName'));
const lastNameField = () => screen.getByLabelText(akMT('lastName'));
const usernameField = () => screen.getByLabelText(akMT('username'));
const passwordField = () => screen.getByLabelText(akMT('password'));
const confirmPasswordField = () => screen.getByLabelText(akMT('confirmPassword'));
const termsCheckbox = () => screen.getByRole('checkbox');
const submitButton = () => screen.getByRole('button', { name: akMT('register') });

const openInvitation = () => renderAtRoute(`/invite/${TOKEN}`);

/** Fills in the account the invitation asks for, and submits. */
async function acceptInvitation({
  username = USERNAME,
  password = PASSWORD,
  confirm_password = PASSWORD,
  acceptTerms = true,
  withPassword = true,
} = {}) {
  await userEvent.type(firstNameField(), FIRST_NAME);
  await userEvent.type(lastNameField(), LAST_NAME);
  await userEvent.type(usernameField(), username);

  /* An organization that enforces SSO renders neither password field. */
  if (withPassword) {
    await userEvent.type(passwordField(), password);
    await userEvent.type(confirmPasswordField(), confirm_password);
  }

  if (acceptTerms) {
    await userEvent.click(termsCheckbox());
  }

  await userEvent.click(submitButton());
}

describe('OrganizationInvitePage', () => {
  it('renders the invited email and organization as read-only fields', async () => {
    invitationIs();

    await openInvitation();

    expect(await screen.findByDisplayValue(INVITATION.email)).toBeDisabled();
    expect(screen.getByDisplayValue(INVITATION.company)).toBeDisabled();
  });

  it('packs the name fields to the top, so an error under one does not drop the other out of line', async () => {
    invitationIs();

    await openInvitation();

    const firstName = await screen.findByLabelText(akMT('firstName'));
    const lastName = screen.getByLabelText(akMT('lastName'));

    expect(firstName.closest('[data-slot="form-item"]')).toHaveClass('content-start');
    expect(lastName.closest('[data-slot="form-item"]')).toHaveClass('content-start');
  });

  it('renders the skeleton while the invitation request is in flight', async () => {
    server.use(http.get(inviteUrl, () => new Promise(() => undefined)));

    await openInvitation();

    expect(screen.queryByRole('button', { name: akMT('register') })).not.toBeInTheDocument();
  });

  it('renders the invalid-invitation state when the token matches no open invitation', async () => {
    invitationIsGone();

    await openInvitation();

    expect(await screen.findByText(akMT('somethingWentWrong'))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: akMT('register') })).not.toBeInTheDocument();
  });

  it('posts the account fields to the invitation endpoint', async () => {
    invitationIs();

    let sent: Record<string, unknown> | undefined;

    server.use(
      http.post(inviteUrl, async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;

        return new HttpResponse(null, { status: HTTP_STATUS_CODES.NO_CONTENT });
      })
    );

    await openInvitation();
    await screen.findByLabelText(akMT('username'));
    await acceptInvitation();

    await waitFor(() =>
      expect(sent).toEqual({
        username: USERNAME,
        first_name: FIRST_NAME,
        last_name: LAST_NAME,
        terms_accepted: true,
        password: PASSWORD,
        confirm_password: PASSWORD,
      })
    );
  });

  it('renders the confirmation asking the user to sign in once the invitation is accepted', async () => {
    invitationIs();

    server.use(
      http.post(inviteUrl, () => new HttpResponse(null, { status: HTTP_STATUS_CODES.NO_CONTENT }))
    );

    await openInvitation();
    await screen.findByLabelText(akMT('username'));
    await acceptInvitation();

    expect(await screen.findByText(akMT('invitationRegisterConfirmation'))).toBeInTheDocument();
    expect(screen.getByText(akMT('pleaseLogin'))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: akMT('login') })).toBeInTheDocument();
  });

  describe('an organization that enforces SSO', () => {
    it('renders no password fields when the organization enforces SSO', async () => {
      invitationIs({ is_sso_enforced: true });

      await openInvitation();

      expect(await screen.findByLabelText(akMT('username'))).toBeInTheDocument();
      expect(screen.queryByLabelText(akMT('password'))).not.toBeInTheDocument();
      expect(screen.queryByLabelText(akMT('confirmPassword'))).not.toBeInTheDocument();
    });

    it('posts no password fields when the organization enforces SSO', async () => {
      invitationIs({ is_sso_enforced: true });

      let sent: Record<string, unknown> | undefined;

      server.use(
        http.post(inviteUrl, async ({ request }) => {
          sent = (await request.json()) as Record<string, unknown>;

          return new HttpResponse(null, { status: HTTP_STATUS_CODES.NO_CONTENT });
        })
      );

      await openInvitation();
      await screen.findByLabelText(akMT('username'));
      await acceptInvitation({ withPassword: false });

      await waitFor(() =>
        expect(sent).toEqual({
          username: USERNAME,
          first_name: FIRST_NAME,
          last_name: LAST_NAME,
          terms_accepted: true,
        })
      );
    });
  });

  describe('validation the form applies before sending the request', () => {
    it('rejects a username under three characters', async () => {
      invitationIs();

      await openInvitation();
      await screen.findByLabelText(akMT('username'));
      await acceptInvitation({ username: 'ab' });

      expect(await screen.findByText(akMT('usernameMinLengthError'))).toBeInTheDocument();
    });

    it('rejects a password under ten characters', async () => {
      invitationIs();

      await openInvitation();
      await screen.findByLabelText(akMT('username'));
      await acceptInvitation({ password: 'short', confirm_password: 'short' });

      expect(await screen.findByText(akMT('passwordMinLengthError'))).toBeInTheDocument();
    });

    it('rejects a confirmation that differs from the password', async () => {
      invitationIs();

      await openInvitation();
      await screen.findByLabelText(akMT('username'));
      await acceptInvitation({ confirm_password: 'something else entirely' });

      expect(await screen.findByText(akMT('passwordMatchError'))).toBeInTheDocument();
    });

    it('rejects the form while the terms box is unticked', async () => {
      invitationIs();

      await openInvitation();
      await screen.findByLabelText(akMT('username'));
      await acceptInvitation({ acceptTerms: false });

      expect(await screen.findByText(akMT('acceptTermsError'))).toBeInTheDocument();
    });
  });

  describe('errors the API returns', () => {
    it('renders a username error under the username field', async () => {
      invitationIs();
      acceptanceFailsWith({ username: ['A user with that username already exists.'] });

      await openInvitation();
      await screen.findByLabelText(akMT('username'));
      await acceptInvitation();

      expect(
        await screen.findByText('A user with that username already exists.')
      ).toBeInTheDocument();
    });

    it('renders a notification when the error names no field', async () => {
      invitationIs();
      acceptanceFailsWith({ detail: ['Not found.'] }, HTTP_STATUS_CODES.NOT_FOUND);

      await openInvitation();
      await screen.findByLabelText(akMT('username'));
      await acceptInvitation();

      expect(await screen.findByText(akMT('somethingWentWrong'))).toBeInTheDocument();
    });
  });
});
