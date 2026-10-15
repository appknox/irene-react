import { faker } from '@faker-js/faker';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { AuthEndpoints } from '@irene/api/services/auth';
import { configurationStore } from '@irene/api/stores/configuration';
import { getStoredSession, storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';

import { buildServerConfiguration, buildSession } from '@tests/factories';
import { mockMfaMethods } from '@tests/mfa';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const SECURITY_SETTINGS = '/dashboard/settings/security';

const CHANGE_PASSWORD_URL = buildAPITestURL(AuthEndpoints.changePassword());

/** The three passwords a user types, the new one twice. */
const buildPasswords = () => {
  const newPassword = faker.internet.password({ length: 12 });

  return {
    old_password: faker.internet.password({ length: 12 }),
    password: newPassword,
    confirm_password: newPassword,
  };
};

const fillIn = async (passwords: Partial<ReturnType<typeof buildPasswords>>) => {
  if (passwords.old_password) {
    await userEvent.type(
      await screen.findByLabelText(akMT('currentPassword')),
      passwords.old_password
    );
  }

  if (passwords.password) {
    await userEvent.type(screen.getByLabelText(akMT('newPassword')), passwords.password);
  }

  if (passwords.confirm_password) {
    await userEvent.type(
      screen.getByLabelText(akMT('confirmPassword')),
      passwords.confirm_password
    );
  }
};

const submit = async () =>
  userEvent.click(await screen.findByRole('button', { name: akMT('changePassword') }));

describe('PasswordChange', () => {
  beforeEach(() => {
    storeSession(buildSession());
    configurationStore.getState().setServerConfiguration(buildServerConfiguration());
    mockMfaMethods();
  });

  it('asks for the current and the new password before sending anything', async () => {
    let wasSent = false;

    server.use(
      http.post(CHANGE_PASSWORD_URL, () => {
        wasSent = true;

        return new HttpResponse(null, { status: HTTP_STATUS_CODES.NO_CONTENT });
      })
    );

    await renderAtRoute(SECURITY_SETTINGS);
    await submit();

    expect(await screen.findByText(akMT('enterCurrentPassword'))).toBeInTheDocument();
    expect(screen.getByText(akMT('enterNewPassword'))).toBeInTheDocument();
    expect(wasSent).toBe(false);
  });

  it('says so when the two new passwords differ', async () => {
    const passwords = buildPasswords();

    await renderAtRoute(SECURITY_SETTINGS);
    await fillIn({ ...passwords, confirm_password: `${passwords.password}x` });
    await submit();

    expect(await screen.findByText(akMT('passwordMatchError'))).toBeInTheDocument();
  });

  it('sends the passwords, then signs out to the login page, since the server ended every session', async () => {
    const passwords = buildPasswords();
    let body: unknown;

    server.use(
      http.post(CHANGE_PASSWORD_URL, async ({ request }) => {
        body = await request.json();

        return new HttpResponse(null, { status: HTTP_STATUS_CODES.NO_CONTENT });
      })
    );

    const { router } = await renderAtRoute(SECURITY_SETTINGS);
    await fillIn(passwords);
    await submit();

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(body).toEqual(passwords);
    expect(getStoredSession()).toBeNull();
    expect(await screen.findByText(akMT('passwordChanged'))).toBeInTheDocument();
  });

  it('puts the server’s complaint under the field it names', async () => {
    const message = faker.lorem.sentence();

    server.use(
      http.post(CHANGE_PASSWORD_URL, () =>
        HttpResponse.json({ old_password: [message] }, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    await renderAtRoute(SECURITY_SETTINGS);
    await fillIn(buildPasswords());
    await submit();

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(getStoredSession()).not.toBeNull();
  });

  it('says something went wrong when the refusal names no field', async () => {
    server.use(
      http.post(CHANGE_PASSWORD_URL, () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    await renderAtRoute(SECURITY_SETTINGS);
    await fillIn(buildPasswords());
    await submit();

    expect(await screen.findByText(akMT('somethingWentWrong'))).toBeInTheDocument();
  });
});
