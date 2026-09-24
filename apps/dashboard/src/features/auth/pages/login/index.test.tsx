import { faker } from '@faker-js/faker';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import {
  API_LOGIN_REFUSAL_MESSAGES,
  AuthEndpoints,
  type ApiSsoCheck,
} from '@irene/api/services/auth';

import { ConfigurationEndpoints } from '@irene/api/services/configuration/endpoints';
import { formatWaitTime, rateLimitStore } from '@irene/api/stores/rate-limit';
import { APPKNOX_SUPPORT_EMAIL, HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';

import { buildFrontendConfiguration } from '@tests/factories';
import { buildSsoCheck } from '@tests/factories/sso';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

/** Where a signed-in account lands, after the home page hands it its one product. */
const SIGNED_IN_LANDING = '/dashboard/projects';

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

const realLocation = window.location;

/** Put the tab on Appknox's own host, which is where Appknox answers its support. */
function onAppknoxHost() {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...realLocation, href: 'https://secure.appknox.com/login' },
  });
}

// The stub above outlives the render, so put the real location back.
afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: realLocation });
});

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
  it('renders only the username field until api/check_login answers', async () => {
    await renderAtRoute('/login');

    expect(usernameField()).toBeInTheDocument();
    expect(screen.queryByLabelText(akMT('password'))).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: akMT('next') })).toBeInTheDocument();
  });

  it('disables the submit button and shows no error while the username is empty', async () => {
    await renderAtRoute('/login');

    expect(screen.getByRole('button', { name: akMT('next') })).toBeDisabled();
    expect(screen.queryByText('Enter Username/Email ID')).not.toBeInTheDocument();

    // An untouched field must not look like a mistake.
    expect(usernameField()).toHaveAttribute('aria-invalid', 'false');
  });

  it('enables the submit button once a username is typed', async () => {
    checkReturns({});
    await renderAtRoute('/login');

    await userEvent.type(usernameField(), USERNAME);

    expect(screen.getByRole('button', { name: akMT('next') })).toBeEnabled();
  });

  it('clears the required-field error when the password is typed and deleted again', async () => {
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

  it('keeps the username step and shows a notification when api/check_login fails', async () => {
    server.use(http.post(CHECK_URL, () => HttpResponse.error()));
    await renderAtRoute('/login');

    await submitUsername();

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
    expect(screen.queryByLabelText(akMT('password'))).not.toBeInTheDocument();
  });

  it('renders the password field when the account has no identity provider', async () => {
    checkReturns({});
    await renderAtRoute('/login');

    await submitUsername();

    expect(await screen.findByLabelText(akMT('password'))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: akMT('ssoLogin') })).not.toBeInTheDocument();
  });

  it('renders the password field and the SSO button when the account may use either', async () => {
    checkReturns({ is_saml: true });
    await renderAtRoute('/login');

    await submitUsername();

    expect(await screen.findByLabelText(akMT('password'))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: akMT('ssoLogin') })).toBeInTheDocument();
  });

  it('renders no password field when the organization enforces SSO', async () => {
    checkReturns({ is_oidc: true, is_sso_enforced: true });
    await renderAtRoute('/login');

    await submitUsername();

    expect(await screen.findByRole('button', { name: akMT('ssoLogin') })).toBeInTheDocument();
    expect(screen.queryByLabelText(akMT('password'))).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: akMT('login') })).not.toBeInTheDocument();

    // The step it replaced must be gone, not merely rendered above it.
    expect(screen.queryByRole('button', { name: akMT('next') })).not.toBeInTheDocument();
  });

  it('removes the username step from the DOM once the password step renders', async () => {
    checkReturns({});
    await renderAtRoute('/login');

    await submitUsername();

    expect(await screen.findByLabelText(akMT('password'))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: akMT('next') })).not.toBeInTheDocument();
    expect(screen.getAllByLabelText(akMT('usernameEmailIdTextLabel'))).toHaveLength(1);
  });

  it('marks the username and password fields and renders the error when the password is wrong', async () => {
    checkReturns({});
    loginRefusedWith(CREDENTIALS_REJECTED);
    await renderAtRoute('/login');

    await attemptLogin();

    expect(await screen.findByText(akMT('credentialsIncorrect'))).toBeInTheDocument();

    expect(usernameField()).toHaveAttribute('aria-invalid', 'true');
    expect(passwordField()).toHaveAttribute('aria-invalid', 'true');
  });

  it('clears the wrong-password error when the user edits the password', async () => {
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

    it('renders the account-locked message and marks the password field', async () => {
      await lockOut();

      expect(screen.getByText(LOCKED_MESSAGE, { exact: false })).toBeInTheDocument();
      expect(passwordField()).toHaveAttribute('aria-invalid', 'true');
    });

    it('renders the support address as a mailto link on an Appknox host', async () => {
      onAppknoxHost();
      await lockOut();

      expect(screen.getByRole('link', { name: akMT('contactSupport') })).toHaveAttribute(
        'href',
        `mailto:${APPKNOX_SUPPORT_EMAIL}`
      );
    });

    it('renders the support address as plain text on a whitelabel host', async () => {
      await lockOut();

      expect(screen.queryByRole('link', { name: akMT('contactSupport') })).not.toBeInTheDocument();
    });

    it('renders a password reset link in place of the submit button', async () => {
      const { router } = await lockOut();

      const reset = screen.getByRole('link', { name: akMT('resetPassword') });

      expect(reset).toHaveAttribute('href', '/recover');

      await userEvent.click(reset);
      await waitFor(() => expect(router.state.location.pathname).toBe('/recover'));

      expect(screen.queryByRole('button', { name: akMT('login') })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: akMT('forgotPassword') })).not.toBeInTheDocument();
    });

    it('keeps the account-locked message while the user edits the password', async () => {
      await lockOut();

      await userEvent.type(passwordField(), 'x');

      expect(screen.getByText(LOCKED_MESSAGE, { exact: false })).toBeInTheDocument();
    });

    it('renders no required-field error after the password is cleared', async () => {
      await lockOut();

      await userEvent.clear(passwordField());

      expect(screen.getByText(LOCKED_MESSAGE, { exact: false })).toBeInTheDocument();
      expect(screen.queryByText(akMT('passwordPlaceholder'))).not.toBeInTheDocument();
    });

    it('clears the account-locked message when a different username is entered', async () => {
      await lockOut();

      await userEvent.type(usernameField(), 'x');

      await waitFor(() =>
        expect(screen.queryByText(LOCKED_MESSAGE, { exact: false })).not.toBeInTheDocument()
      );

      expect(screen.getByRole('button', { name: akMT('next') })).toBeInTheDocument();
    });
  });

  it('renders a notification for a login error the fields cannot carry', async () => {
    checkReturns({});
    loginRefusedWith('Your organisation has been suspended', 403);
    await renderAtRoute('/login');

    await attemptLogin();

    expect(await screen.findByText('Your organisation has been suspended')).toBeInTheDocument();
    expect(passwordField()).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('renders the network error notification when the login request never reaches the server', async () => {
    checkReturns({});
    server.use(http.post(LOGIN_URL, () => HttpResponse.error()));
    await renderAtRoute('/login');

    await attemptLogin();

    expect(await screen.findByText(akMT('networkError'))).toBeInTheDocument();
  });

  it('stores the session and navigates away from /login on a successful sign-in', async () => {
    checkReturns({});
    server.use(http.post(LOGIN_URL, () => HttpResponse.json({ token: 'tok3n', user_id: 42 })));

    const { router } = await renderAtRoute('/login');

    await attemptLogin();

    await waitFor(() => expect(router.state.location.pathname).toBe(SIGNED_IN_LANDING));
  });

  it('navigates to /recover when the user clicks the forgotten-password link', async () => {
    checkReturns({});

    const { router } = await renderAtRoute('/login');

    await submitUsername();
    await userEvent.click(await screen.findByRole('link', { name: akMT('forgotPassword') }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/recover'));
  });

  describe('an account the server has throttled', () => {
    // The lock is app-wide and outlives a render, so it cannot leak into the
    // cases below.
    // Wrapped: ending the wait updates whatever is still mounted.
    afterEach(() => act(() => rateLimitStore.getState().clearThrottle()));

    it('renders the rate-limit countdown on the login page', async () => {
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

    it('renders no password error while the account is rate limited', async () => {
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

  describe('the alert explaining why the user was sent to /login', () => {
    it('renders the unauthenticated alert for ?unauthenticated=true', async () => {
      await renderAtRoute('/login?unauthenticated=true');

      expect(screen.getByText(akMT('pleaseLogin'))).toBeInTheDocument();
    });

    it('renders the session-expired alert for ?sessionExpired=true', async () => {
      await renderAtRoute('/login?sessionExpired=true');

      expect(screen.getByText(akMT('pleaseLoginAgain'))).toBeInTheDocument();
    });

    it('renders the deactivated-account alert for ?userInactive=true', async () => {
      await renderAtRoute('/login?userInactive=true');

      expect(screen.getByText(akMT('loginFailed'))).toBeInTheDocument();
    });

    it('renders no alert when the URL carries no reason', async () => {
      await renderAtRoute('/login');

      expect(screen.queryByText(akMT('pleaseLogin'))).not.toBeInTheDocument();
      expect(screen.queryByText(akMT('pleaseLoginAgain'))).not.toBeInTheDocument();
      expect(screen.queryByText(akMT('loginFailed'))).not.toBeInTheDocument();
    });

    it('removes the reason from the URL when the user dismisses the alert', async () => {
      const { router } = await renderAtRoute('/login?sessionExpired=true');

      await userEvent.click(screen.getByRole('button', { name: 'Close' }));

      await waitFor(() => expect(router.state.location.search).toEqual({}));

      expect(screen.queryByText(akMT('pleaseLoginAgain'))).not.toBeInTheDocument();
    });

    it('renders the deactivated-account alert when the URL also carries sessionExpired', async () => {
      await renderAtRoute('/login?sessionExpired=true&userInactive=true');

      expect(screen.getByText(akMT('loginFailed'))).toBeInTheDocument();
      expect(screen.queryByText(akMT('pleaseLoginAgain'))).not.toBeInTheDocument();
    });
  });

  it('reserves the logo and footer space while the frontend configuration request is in flight', async () => {
    server.use(
      http.get(buildAPITestURL(ConfigurationEndpoints.frontend()), async () => {
        await delay('infinite');

        return HttpResponse.json(buildFrontendConfiguration());
      })
    );

    await renderAtRoute('/login');

    expect(document.querySelector('[data-test-app-logo-pending]')).toBeInTheDocument();
    expect(document.querySelector('[data-test-registration-footer-pending]')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText(akMT('dontHaveAccount'))).not.toBeInTheDocument();
  });

  it('renders the registration link once the frontend configuration resolves', async () => {
    server.use(
      http.get(buildAPITestURL(ConfigurationEndpoints.frontend()), () =>
        HttpResponse.json(buildFrontendConfiguration({ registration_enabled: true }))
      )
    );

    await renderAtRoute('/login');

    expect(await screen.findByText(akMT('dontHaveAccount'))).toBeInTheDocument();

    expect(
      document.querySelector('[data-test-registration-footer-pending]')
    ).not.toBeInTheDocument();
  });

  describe('returning to the path the guard blocked', () => {
    /* A sign-in that succeeds, so the navigation afterwards is what is under test. */
    const signsIn = () => {
      checkReturns({});
      server.use(http.post(LOGIN_URL, () => HttpResponse.json({ token: 'tok3n', user_id: 42 })));
    };

    /* Each case signs in from a `/login` URL and names where the router lands. */
    const REDIRECT_CASES = [
      {
        destination: 'the path the guard came from',
        loginUrl: '/login?redirectTo=%2Fdashboard%2Foidc%2Fredirect%3Foidc_token%3Dabc',
        pathname: '/dashboard/oidc/redirect',
      },
      {
        destination: 'the dashboard when no path was asked for',
        loginUrl: '/login',
        pathname: SIGNED_IN_LANDING,
      },
      {
        destination: 'the dashboard when the path would leave the app',
        loginUrl: '/login?redirectTo=https%3A%2F%2Fevil.example.test',
        pathname: SIGNED_IN_LANDING,
      },
    ];

    it.each(REDIRECT_CASES)('returns to $destination', async ({ loginUrl, pathname }) => {
      signsIn();

      const { router } = await renderAtRoute(loginUrl);

      await attemptLogin();

      await waitFor(() => expect(router.state.location.pathname).toBe(pathname));
    });
  });
});
