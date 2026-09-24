import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { HTTP_STATUS_CODES } from '@irene/constants';

import { RegistrationEndpoints, RegistrationService } from '@irene/api/services/registration';
import { getApiErrorStatus } from '@irene/api/utils/errors';
import { buildAPITestURL, server } from '@tests/server';

const TOKEN = 'invitation-token';

const registerUrl = buildAPITestURL(RegistrationEndpoints.register());
const inviteUrl = buildAPITestURL(RegistrationEndpoints.invite());
const organizationInviteUrl = buildAPITestURL(RegistrationEndpoints.organizationInvite(TOKEN));

const REGISTRATION = {
  email: 'someone@example.test',
  company: 'Acme',
  first_name: '',
  last_name: '',
  recaptcha: 'notenabled',
};

describe('RegistrationService.register', () => {
  it('posts email, company and the reCAPTCHA token', async () => {
    let sent: Record<string, unknown> | undefined;

    server.use(
      http.post(registerUrl, async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;

        return new HttpResponse(null, { status: HTTP_STATUS_CODES.NO_CONTENT });
      })
    );

    await RegistrationService.register(REGISTRATION);

    expect(sent).toEqual(REGISTRATION);
  });

  it('rejects with the field errors the API returned', async () => {
    server.use(
      http.post(registerUrl, () =>
        HttpResponse.json(
          { email: ['Enter a valid email address.'] },
          {
            status: HTTP_STATUS_CODES.BAD_REQUEST,
          }
        )
      )
    );

    const error = await RegistrationService.register(REGISTRATION).catch(
      (reason: unknown) => reason
    );

    expect(getApiErrorStatus(error)).toBe(HTTP_STATUS_CODES.BAD_REQUEST);
  });
});

describe('RegistrationService.getInvitedRegistration', () => {
  it('sends the token as a query parameter', async () => {
    let asked = '';

    server.use(
      http.get(inviteUrl, ({ request }) => {
        asked = new URL(request.url).searchParams.get('token') ?? '';

        return HttpResponse.json({ email: 'invited@example.test', company: 'Acme' });
      })
    );

    await RegistrationService.getInvitedRegistration(TOKEN);

    expect(asked).toBe(TOKEN);
  });
});

describe('RegistrationService.registerViaInvite', () => {
  it('returns the session the API grants', async () => {
    const session = { token: 'api-token', user_id: 7 };

    server.use(http.post(inviteUrl, () => HttpResponse.json(session)));

    await expect(
      RegistrationService.registerViaInvite({
        token: TOKEN,
        username: 'mock.user',
        company: 'Acme',
        first_name: 'Mock',
        last_name: 'User',
        password: 'a-long-password',
        confirm_password: 'a-long-password',
        terms_accepted: true,
      })
    ).resolves.toEqual(session);
  });
});

describe('RegistrationService.getOrganizationInvitation', () => {
  it('gets the invitation the token names', async () => {
    const invitation = { email: 'invited@example.test', company: 'Acme', is_sso_enforced: false };

    server.use(http.get(organizationInviteUrl, () => HttpResponse.json(invitation)));

    await expect(RegistrationService.getOrganizationInvitation(TOKEN)).resolves.toEqual(invitation);
  });

  it('rejects with a 404 for a spent or unknown token', async () => {
    server.use(
      http.get(organizationInviteUrl, () =>
        HttpResponse.json({ detail: 'Not found.' }, { status: HTTP_STATUS_CODES.NOT_FOUND })
      )
    );

    const error = await RegistrationService.getOrganizationInvitation(TOKEN).catch(
      (reason: unknown) => reason
    );

    expect(getApiErrorStatus(error)).toBe(HTTP_STATUS_CODES.NOT_FOUND);
  });
});

describe('RegistrationService.acceptOrganizationInvitation', () => {
  it('posts the account fields to the invitation endpoint', async () => {
    let sent: Record<string, unknown> | undefined;

    server.use(
      http.post(organizationInviteUrl, async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;

        return new HttpResponse(null, { status: HTTP_STATUS_CODES.NO_CONTENT });
      })
    );

    const account = {
      username: 'mock.user',
      first_name: 'Mock',
      last_name: 'User',
      password: 'a-long-password',
      confirm_password: 'a-long-password',
      terms_accepted: true,
    };

    await RegistrationService.acceptOrganizationInvitation({ token: TOKEN, account });

    expect(sent).toEqual(account);
  });
});
