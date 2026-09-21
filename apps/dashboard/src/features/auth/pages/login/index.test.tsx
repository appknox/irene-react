import { faker } from '@faker-js/faker';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import {
  API_LOGIN_REFUSAL_MESSAGES,
  AuthEndpoints,
  type ApiSsoCheck,
} from '@irene/api/services/auth';

import { formatWaitTime, rateLimitStore } from '@irene/api/stores/rate-limit';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';

import { buildSsoCheck } from '@tests/factories/sso';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const USERNAME = faker.internet.email();
const PASSWORD = faker.internet.password();

const CHECK_URL = buildAPITestURL(AuthEndpoints.ssoCheck());
const LOGIN_URL = buildAPITestURL(AuthEndpoints.login());

/** Answer the SSO check with how this account signs in. */
function checkReturns(check: Partial<ApiSsoCheck>) {
  server.use(http.post(CHECK_URL, () => HttpResponse.json(buildSsoCheck(check))));
}

/** Refuse the sign-in with the message the API would send. */
function loginRefusedWith(message: string, status = 401) {
  server.use(http.post(LOGIN_URL, () => HttpResponse.json({ message }, { status })));
}

const { CREDENTIALS_REJECTED, ACCOUNT_LOCKED } = API_LOGIN_REFUSAL_MESSAGES;

/* Trimmed: the message ends in a space, which the DOM text does not keep. */
const LOCKED_MESSAGE = akMT('lockedAccount').trim();

/** Turn the deployment's whitelabel branding on, as an operator's config would. */
function whitelabelled() {
  globalThis.__BUILD_CONFIG__ = { WHITELABEL_ENABLED: 'true' };
}

const usernameField = () => screen.getByLabelText(akMT('usernameEmailIdTextLabel'));
const passwordField = () => screen.getByLabelText(akMT('password'));

/** Fill in the username and press Next, landing on whichever step follows. */
async function submitUsername(username = USERNAME) {
  await userEvent.type(usernameField(), username);
  await userEvent.click(screen.getByRole('button', { name: akMT('next') }));
}

/** Get to the password step and try to sign in. */
async function attemptLogin(password = PASSWORD) {
  await submitUsername();
  await userEvent.type(await screen.findByLabelText(akMT('password')), password);
  await userEvent.click(screen.getByRole('button', { name: akMT('login') }));
}

describe('LoginPage', () => {
  it('asks only for the username until the check says how the account signs in', async () => {
    await renderAtRoute('/login');

    expect(usernameField()).toBeInTheDocument();
    expect(screen.queryByLabelText(akMT('password'))).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: akMT('next') })).toBeInTheDocument();
  });

  it('cannot run the check without a username, and does not nag about it', async () => {
    await renderAtRoute('/login');

    expect(screen.getByRole('button', { name: akMT('next') })).toBeDisabled();
    expect(screen.queryByText('Enter Username/Email ID')).not.toBeInTheDocument();

    // An untouched field must not look like a mistake.
    expect(usernameField()).toHaveAttribute('aria-invalid', 'false');
  });

  it('enables the check once a username is typed', async () => {
    checkReturns({});
    await renderAtRoute('/login');

    await userEvent.type(usernameField(), USERNAME);

    expect(screen.getByRole('button', { name: akMT('next') })).toBeEnabled();
  });

  it('stops complaining when a typed password is deleted again', async () => {
    checkReturns({});
    loginRefusedWith(CREDENTIALS_REJECTED);
    await renderAtRoute('/login');

    await attemptLogin();
    await screen.findByText(akMT('credentialsIncorrect'));

    await userEvent.clear(passwordField());

    // Deleting a value is the form being incomplete, not the user being wrong.
    expect(screen.queryByText(akMT('passwordPlaceholder'))).not.toBeInTheDocument();
    expect(passwordField()).toHaveAttribute('aria-invalid', 'false');
    expect(screen.getByRole('button', { name: akMT('login') })).toBeDisabled();
  });

  it('keeps the user on the first step and warns when the check fails', async () => {
    server.use(http.post(CHECK_URL, () => HttpResponse.error()));
    await renderAtRoute('/login');

    await submitUsername();

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
    expect(screen.queryByLabelText(akMT('password'))).not.toBeInTheDocument();
  });

  it('asks for a password when the account has no identity provider', async () => {
    checkReturns({});
    await renderAtRoute('/login');

    await submitUsername();

    expect(await screen.findByLabelText(akMT('password'))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: akMT('ssoLogin') })).not.toBeInTheDocument();
  });

  it('offers both ways in when the account has an identity provider it may skip', async () => {
    checkReturns({ is_saml: true });
    await renderAtRoute('/login');

    await submitUsername();

    expect(await screen.findByLabelText(akMT('password'))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: akMT('ssoLogin') })).toBeInTheDocument();
  });

  it('drops the password when the organisation allows nothing but SSO', async () => {
    checkReturns({ is_oidc: true, is_sso_enforced: true });
    await renderAtRoute('/login');

    await submitUsername();

    expect(await screen.findByRole('button', { name: akMT('ssoLogin') })).toBeInTheDocument();
    expect(screen.queryByLabelText(akMT('password'))).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: akMT('login') })).not.toBeInTheDocument();

    // The step it replaced must be gone, not merely rendered above it.
    expect(screen.queryByRole('button', { name: akMT('next') })).not.toBeInTheDocument();
  });

  it('shows one step at a time, never the check alongside what replaced it', async () => {
    checkReturns({});
    await renderAtRoute('/login');

    await submitUsername();

    expect(await screen.findByLabelText(akMT('password'))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: akMT('next') })).not.toBeInTheDocument();
    expect(screen.getAllByLabelText(akMT('usernameEmailIdTextLabel'))).toHaveLength(1);
  });

  it('marks both fields and names the problem when the password is wrong', async () => {
    checkReturns({});
    loginRefusedWith(CREDENTIALS_REJECTED);
    await renderAtRoute('/login');

    await attemptLogin();

    expect(await screen.findByText(akMT('credentialsIncorrect'))).toBeInTheDocument();

    expect(usernameField()).toHaveAttribute('aria-invalid', 'true');
    expect(passwordField()).toHaveAttribute('aria-invalid', 'true');
  });

  it('clears a wrong-password message as soon as the password is edited', async () => {
    checkReturns({});
    loginRefusedWith(CREDENTIALS_REJECTED);
    await renderAtRoute('/login');

    await attemptLogin();
    await screen.findByText(akMT('credentialsIncorrect'));

    await userEvent.type(passwordField(), 'x');

    await waitFor(() =>
      expect(screen.queryByText(akMT('credentialsIncorrect'))).not.toBeInTheDocument()
    );
  });

  describe('a locked account', () => {
    /** Reach the locked state, which needs a check and a refused sign-in. */
    async function lockOut() {
      checkReturns({});
      loginRefusedWith(ACCOUNT_LOCKED);

      const rendered = await renderAtRoute('/login');

      await attemptLogin();
      await screen.findByText(LOCKED_MESSAGE, { exact: false });

      return rendered;
    }

    it('explains the lock and marks the field', async () => {
      await lockOut();

      expect(screen.getByText(LOCKED_MESSAGE, { exact: false })).toBeInTheDocument();
      expect(passwordField()).toHaveAttribute('aria-invalid', 'true');
    });

    it('links support on an Appknox deployment, where Appknox answers it', async () => {
      await lockOut();

      expect(screen.getByRole('link', { name: akMT('contactSupport') })).toHaveAttribute(
        'href',
        'mailto:support@appknox.com'
      );
    });

    it('leaves support as plain text on a whitelabel deployment, which routes its own', async () => {
      whitelabelled();
      await lockOut();

      expect(screen.queryByRole('link', { name: akMT('contactSupport') })).not.toBeInTheDocument();
    });

    it('offers a password reset instead of another attempt', async () => {
      const { router } = await lockOut();

      const reset = screen.getByRole('link', { name: akMT('resetPassword') });

      expect(reset).toHaveAttribute('href', '/recover');

      await userEvent.click(reset);
      await waitFor(() => expect(router.state.location.pathname).toBe('/recover'));

      expect(screen.queryByRole('button', { name: akMT('login') })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: akMT('forgotPassword') })).not.toBeInTheDocument();
    });

    it('holds the message while the password is edited, since retyping cannot help', async () => {
      await lockOut();

      await userEvent.type(passwordField(), 'x');

      expect(screen.getByText(LOCKED_MESSAGE, { exact: false })).toBeInTheDocument();
    });

    it('does not also nag about the empty field once the password is cleared', async () => {
      await lockOut();

      await userEvent.clear(passwordField());

      expect(screen.getByText(LOCKED_MESSAGE, { exact: false })).toBeInTheDocument();
      expect(screen.queryByText(akMT('passwordPlaceholder'))).not.toBeInTheDocument();
    });

    it('lifts once a different username is entered', async () => {
      await lockOut();

      await userEvent.type(usernameField(), 'x');

      await waitFor(() =>
        expect(screen.queryByText(LOCKED_MESSAGE, { exact: false })).not.toBeInTheDocument()
      );

      expect(screen.getByRole('button', { name: akMT('next') })).toBeInTheDocument();
    });
  });

  it('raises any other refusal from the server as a toast', async () => {
    checkReturns({});
    loginRefusedWith('Your organisation has been suspended', 403);
    await renderAtRoute('/login');

    await attemptLogin();

    expect(await screen.findByText('Your organisation has been suspended')).toBeInTheDocument();
    expect(passwordField()).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('reports an unreachable server rather than blaming the credentials', async () => {
    checkReturns({});
    server.use(http.post(LOGIN_URL, () => HttpResponse.error()));
    await renderAtRoute('/login');

    await attemptLogin();

    expect(await screen.findByText(akMT('networkError'))).toBeInTheDocument();
  });

  it('signs the user in and leaves the login page', async () => {
    checkReturns({});
    server.use(http.post(LOGIN_URL, () => HttpResponse.json({ token: 'tok3n', user_id: 42 })));

    const { router } = await renderAtRoute('/login');

    await attemptLogin();

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
  });

  it('sends a user who forgot their password to the recover page', async () => {
    checkReturns({});

    const { router } = await renderAtRoute('/login');

    await submitUsername();
    await userEvent.click(await screen.findByRole('link', { name: akMT('forgotPassword') }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/recover'));
  });

  describe('an account the server has throttled', () => {
    // The lock is app-wide and outlives a render, so it cannot leak into the
    // cases below.
    afterEach(() => rateLimitStore.getState().clearThrottle());

    it('counts the wait down on the login page, which no signed-in layout wraps', async () => {
      checkReturns({});

      server.use(
        http.post(LOGIN_URL, () =>
          HttpResponse.json(
            { detail: { lock_time: 45 } },
            { status: HTTP_STATUS_CODES.TOO_MANY_REQUESTS }
          )
        )
      );

      await renderAtRoute('/login');
      await attemptLogin();

      expect(
        await screen.findByText(`${akMT('rateLimitExceeded')} ${formatWaitTime(45)}`)
      ).toBeInTheDocument();
    });

    it('does not also blame the credentials, which were never the problem', async () => {
      checkReturns({});

      server.use(
        http.post(LOGIN_URL, () =>
          HttpResponse.json(
            { detail: { lock_time: 45 } },
            { status: HTTP_STATUS_CODES.TOO_MANY_REQUESTS }
          )
        )
      );

      await renderAtRoute('/login');
      await attemptLogin();
      await screen.findByText(`${akMT('rateLimitExceeded')} ${formatWaitTime(45)}`);

      expect(screen.queryByText(akMT('pleaseEnterValidAccountDetail'))).not.toBeInTheDocument();
    });
  });

  describe('saying why the user is here rather than on the dashboard', () => {
    it('explains a guard turning them away', async () => {
      await renderAtRoute('/login?unauthenticated=true');

      expect(screen.getByText(akMT('pleaseLogin'))).toBeInTheDocument();
    });

    it('explains a credential the server stopped accepting', async () => {
      await renderAtRoute('/login?sessionExpired=true');

      expect(screen.getByText(akMT('pleaseLoginAgain'))).toBeInTheDocument();
    });

    it('sends a deactivated account to their admin, not back around the login loop', async () => {
      await renderAtRoute('/login?userInactive=true');

      expect(screen.getByText(akMT('loginFailed'))).toBeInTheDocument();
    });

    it('says nothing when the user simply came to sign in', async () => {
      await renderAtRoute('/login');

      expect(screen.queryByText(akMT('pleaseLogin'))).not.toBeInTheDocument();
      expect(screen.queryByText(akMT('pleaseLoginAgain'))).not.toBeInTheDocument();
      expect(screen.queryByText(akMT('loginFailed'))).not.toBeInTheDocument();
    });

    it('leads with the deactivated account when a stale link also says expired', async () => {
      await renderAtRoute('/login?sessionExpired=true&userInactive=true');

      expect(screen.getByText(akMT('loginFailed'))).toBeInTheDocument();
      expect(screen.queryByText(akMT('pleaseLoginAgain'))).not.toBeInTheDocument();
    });
  });
});
