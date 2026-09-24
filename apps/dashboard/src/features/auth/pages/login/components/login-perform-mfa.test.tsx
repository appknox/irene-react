import { faker } from '@faker-js/faker';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  API_LOGIN_REFUSAL_MESSAGES,
  AuthEndpoints,
  type ApiMfaType,
} from '@irene/api/services/auth';

import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';

import { buildSsoCheck } from '@tests/factories/sso';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const USERNAME = faker.internet.email();
const PASSWORD = faker.internet.password();
const LOGIN_URL = buildAPITestURL(AuthEndpoints.login());
const { CREDENTIALS_REJECTED, ACCOUNT_LOCKED } = API_LOGIN_REFUSAL_MESSAGES;

/** Every login body the page sent, in order. */
let sent: unknown[] = [];

/**
 * Refuse the first attempt with a second-factor mfaRequirement, then answer later
 * attempts with `then` — which is how the API behaves once the code arrives.
 */
function challengeThen(type: ApiMfaType, forced: string, then: () => Response) {
  sent = [];

  server.use(
    http.post(buildAPITestURL(AuthEndpoints.ssoCheck()), () => HttpResponse.json(buildSsoCheck()))
  );

  server.use(
    http.post(LOGIN_URL, async ({ request }) => {
      const body = await request.json();

      sent.push(body);

      const isFirstAttempt = sent.length === 1;

      return isFirstAttempt
        ? HttpResponse.json({ type, forced }, { status: HTTP_STATUS_CODES.UNAUTHORIZED })
        : then();
    })
  );
}

/** Reach the second-factor step by signing in with the right password. */
async function reachMfaStep() {
  const rendered = await renderAtRoute('/login');

  await userEvent.type(screen.getByLabelText(akMT('usernameEmailIdTextLabel')), USERNAME);

  await userEvent.click(screen.getByRole('button', { name: akMT('next') }));
  await userEvent.type(await screen.findByLabelText(akMT('password')), PASSWORD);
  await userEvent.click(screen.getByRole('button', { name: akMT('login') }));
  await screen.findByRole('button', { name: akMT('verify') });

  return rendered;
}

describe('LoginPerformMfa', () => {
  it('renders the authenticator-app wording when the account uses an app factor', async () => {
    challengeThen('TOTP', 'False', () => HttpResponse.json({}));
    await reachMfaStep();

    expect(screen.getByLabelText(akMT('authenticatorCodeLabel'))).toBeInTheDocument();
    expect(screen.getByText(akMT('authenticatorCode'))).toBeInTheDocument();
  });

  it('renders the email wording when the account uses an email factor', async () => {
    challengeThen('HOTP', 'False', () => HttpResponse.json({}));
    await reachMfaStep();

    expect(screen.getByLabelText(akMT('emailCodeLabel'))).toBeInTheDocument();
    expect(screen.getByText(akMT('emailOTP'))).toBeInTheDocument();
  });

  it('renders the mandatory-2FA notice when the organization mandates it', async () => {
    challengeThen('HOTP', 'True', () => HttpResponse.json({}));
    await reachMfaStep();

    expect(screen.getByText(akMT('organizationMandatory2FA'))).toBeInTheDocument();
  });

  it('renders no mandatory-2FA notice when the user enabled 2FA themselves', async () => {
    challengeThen('TOTP', 'False', () => HttpResponse.json({}));
    await reachMfaStep();

    expect(screen.queryByText(akMT('organizationMandatory2FA'))).not.toBeInTheDocument();
  });

  it('removes the password step from the DOM when the code step renders', async () => {
    challengeThen('TOTP', 'False', () => HttpResponse.json({}));
    await reachMfaStep();

    expect(screen.queryByLabelText(akMT('password'))).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: akMT('login') })).not.toBeInTheDocument();
  });

  it('disables the submit button and shows no error while the code is empty', async () => {
    challengeThen('TOTP', 'False', () => HttpResponse.json({}));
    await reachMfaStep();

    expect(screen.getByRole('button', { name: akMT('verify') })).toBeDisabled();
    expect(screen.queryByText(akMT('enterCode'))).not.toBeInTheDocument();
    expect(sent).toHaveLength(1);
  });

  it('clears the required-field error when the code is typed and deleted again', async () => {
    challengeThen('TOTP', 'False', () =>
      HttpResponse.json(
        { message: CREDENTIALS_REJECTED },
        { status: HTTP_STATUS_CODES.UNAUTHORIZED }
      )
    );

    await reachMfaStep();

    const field = screen.getByLabelText(akMT('authenticatorCodeLabel'));

    await userEvent.type(field, '000000');
    await userEvent.click(screen.getByRole('button', { name: akMT('verify') }));
    await screen.findByText(akMT('credentialsIncorrect'));

    await userEvent.clear(field);

    expect(screen.queryByText(akMT('enterCode'))).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: akMT('verify') })).toBeDisabled();
  });

  it('posts the code alongside the username and password in one login request', async () => {
    challengeThen('TOTP', 'False', () => HttpResponse.json({ token: 'tok3n', user_id: 42 }));

    const { router } = await reachMfaStep();

    await userEvent.type(screen.getByLabelText(akMT('authenticatorCodeLabel')), '123456');

    await userEvent.click(screen.getByRole('button', { name: akMT('verify') }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard/projects'));

    expect(sent[1]).toEqual({
      // The service lowercases it, since the server compares case-insensitively.
      username: USERNAME.toLowerCase(),
      password: PASSWORD,
      otp: '123456',
    });
  });

  it('posts no otp field on the first login request', async () => {
    challengeThen('TOTP', 'False', () => HttpResponse.json({}));
    await reachMfaStep();

    expect(sent[0]).toEqual({ username: USERNAME.toLowerCase(), password: PASSWORD });
  });

  it('renders the wrong-code error on the code field', async () => {
    challengeThen('TOTP', 'False', () =>
      HttpResponse.json(
        { message: CREDENTIALS_REJECTED },
        { status: HTTP_STATUS_CODES.UNAUTHORIZED }
      )
    );

    await reachMfaStep();

    const field = screen.getByLabelText(akMT('authenticatorCodeLabel'));

    await userEvent.type(field, '000000');
    await userEvent.click(screen.getByRole('button', { name: akMT('verify') }));

    expect(await screen.findByText(akMT('credentialsIncorrect'))).toBeInTheDocument();
    expect(field).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders a password reset link when repeated codes lock the account', async () => {
    challengeThen('TOTP', 'False', () =>
      HttpResponse.json({ message: ACCOUNT_LOCKED }, { status: HTTP_STATUS_CODES.UNAUTHORIZED })
    );

    await reachMfaStep();
    await userEvent.type(screen.getByLabelText(akMT('authenticatorCodeLabel')), '000000');
    await userEvent.click(screen.getByRole('button', { name: akMT('verify') }));

    expect(
      await screen.findByText(akMT('lockedAccount').trim(), { exact: false })
    ).toBeInTheDocument();

    expect(screen.getByRole('link', { name: akMT('resetPassword') })).toHaveAttribute(
      'href',
      '/recover'
    );

    expect(screen.queryByRole('button', { name: akMT('verify') })).not.toBeInTheDocument();
  });
});
