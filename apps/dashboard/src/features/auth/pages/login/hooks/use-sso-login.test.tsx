import { faker } from '@faker-js/faker';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthEndpoints, type ApiSsoCheck } from '@irene/api/services/auth';
import { formatWaitTime, rateLimitStore } from '@irene/api/stores/rate-limit';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';

import { buildSsoCheck } from '@tests/factories/sso';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const USERNAME = faker.internet.email();
const IDP_URL = faker.internet.url({ appendSlash: false }) + '/authorize';
const ORIGIN = 'https://dashboard.example.test';

let assignedHref: string | undefined;

/**
 * jsdom refuses a real navigation, so the assignment is captured instead. What
 * matters is which URL the browser would have been sent to.
 */
beforeEach(() => {
  assignedHref = undefined;

  vi.spyOn(window, 'location', 'get').mockReturnValue({
    ...window.location,
    origin: ORIGIN,
    set href(value: string) {
      assignedHref = value;
    },
    get href() {
      return `${ORIGIN}/login`;
    },
  } as Location);
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Answer the SSO check with how this account signs in. */
function checkReturns(check: Partial<ApiSsoCheck>) {
  server.use(
    http.post(buildAPITestURL(AuthEndpoints.ssoCheck()), () =>
      HttpResponse.json(buildSsoCheck(check))
    )
  );
}

/** Get to whichever step the check leads to. */
async function submitUsername() {
  const rendered = await renderAtRoute('/login');

  await userEvent.type(screen.getByLabelText(akMT('usernameEmailIdTextLabel')), USERNAME);

  await userEvent.click(screen.getByRole('button', { name: akMT('next') }));

  return rendered;
}

describe('useSsoLogin', () => {
  it('sends a SAML user to the provider, with the check token and an absolute return URL', async () => {
    checkReturns({ is_saml: true, is_sso_enforced: true, token: 'check-token' });

    let query: URLSearchParams | undefined;

    server.use(
      http.get(buildAPITestURL(AuthEndpoints.samlStart()), ({ request }) => {
        query = new URL(request.url).searchParams;

        return HttpResponse.json({ url: IDP_URL });
      })
    );

    await submitUsername();
    await userEvent.click(await screen.findByRole('button', { name: akMT('ssoLogin') }));

    await waitFor(() => expect(assignedHref).toBe(IDP_URL));

    expect(query?.get('token')).toBe('check-token');
    expect(query?.get('return_to')).toBe(`${ORIGIN}/saml2/redirect`);
  });

  it('sends an OIDC user to the provider with the username, not the SAML token', async () => {
    checkReturns({ is_oidc: true, is_sso_enforced: true });

    let body: unknown;

    server.use(
      http.post(buildAPITestURL(AuthEndpoints.oidcStart()), async ({ request }) => {
        body = await request.json();

        return HttpResponse.json({ url: IDP_URL, provider: 'okta' });
      })
    );

    await submitUsername();
    await userEvent.click(await screen.findByRole('button', { name: akMT('ssoLogin') }));

    await waitFor(() => expect(assignedHref).toBe(IDP_URL));

    expect(body).toEqual({
      username: USERNAME,
      redirect_uri: `${ORIGIN}/sso/oidc/redirect`,
    });
  });

  it('offers SSO beside the password when the account may use either', async () => {
    checkReturns({ is_saml: true, token: 'check-token' });

    server.use(
      http.get(buildAPITestURL(AuthEndpoints.samlStart()), () =>
        HttpResponse.json({ url: IDP_URL })
      )
    );

    await submitUsername();

    expect(await screen.findByLabelText(akMT('password'))).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: akMT('ssoLogin') }));
    await waitFor(() => expect(assignedHref).toBe(IDP_URL));
  });

  it('warns and stays put when the provider cannot be reached', async () => {
    checkReturns({ is_saml: true, is_sso_enforced: true });
    server.use(http.get(buildAPITestURL(AuthEndpoints.samlStart()), () => HttpResponse.error()));

    await submitUsername();
    await userEvent.click(await screen.findByRole('button', { name: akMT('ssoLogin') }));

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
    expect(assignedHref).toBeUndefined();
  });

  it('warns rather than navigating when the response carries no URL', async () => {
    checkReturns({ is_saml: true, is_sso_enforced: true });

    server.use(
      http.get(buildAPITestURL(AuthEndpoints.samlStart()), () => HttpResponse.json({ url: '' }))
    );

    await submitUsername();
    await userEvent.click(await screen.findByRole('button', { name: akMT('ssoLogin') }));

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
    expect(assignedHref).toBeUndefined();
  });

  describe('an account the server has throttled', () => {
    // The lock is app-wide and outlives a render.
    afterEach(() => rateLimitStore.getState().clearThrottle());

    it('counts the wait down instead of telling the user to try again now', async () => {
      checkReturns({ is_saml: true, is_sso_enforced: true, token: 'check-token' });

      server.use(
        http.get(buildAPITestURL(AuthEndpoints.samlStart()), () =>
          HttpResponse.json(
            { detail: { lock_time: 30 } },
            { status: HTTP_STATUS_CODES.TOO_MANY_REQUESTS }
          )
        )
      );

      await submitUsername();
      await userEvent.click(await screen.findByRole('button', { name: akMT('ssoLogin') }));

      expect(
        await screen.findByText(`${akMT('rateLimitExceeded')} ${formatWaitTime(30)}`)
      ).toBeInTheDocument();

      expect(screen.queryByText(akMT('pleaseTryAgain'))).not.toBeInTheDocument();
    });

    it('leaves the user on the login page rather than sending them anywhere', async () => {
      checkReturns({ is_saml: true, is_sso_enforced: true, token: 'check-token' });

      server.use(
        http.get(buildAPITestURL(AuthEndpoints.samlStart()), () =>
          HttpResponse.json(
            { detail: { lock_time: 30 } },
            { status: HTTP_STATUS_CODES.TOO_MANY_REQUESTS }
          )
        )
      );

      await submitUsername();
      await userEvent.click(await screen.findByRole('button', { name: akMT('ssoLogin') }));
      await screen.findByText(`${akMT('rateLimitExceeded')} ${formatWaitTime(30)}`);

      expect(assignedHref).toBeUndefined();
    });
  });
});
