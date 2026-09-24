import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthEndpoints } from '@irene/api/services/auth/endpoints';
import { OidcEndpoints } from '@irene/api/services/oidc/endpoints';
import { OrganizationEndpoints } from '@irene/api/services/organization/endpoints';
import { storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';

import { buildOrganization, buildOrganizationMe, buildSession } from '@tests/factories';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const TOKEN = 'signed-oidc-token';
const GRANTED_CALLBACK = 'https://client.example.test/callback?code=abc&state=123';
const DENIED_CALLBACK = 'https://client.example.test/callback?error=access_denied&state=123';

const authorizationUrl = buildAPITestURL(OidcEndpoints.authorization());
const authorizeUrl = buildAPITestURL(OidcEndpoints.authorize());

/** Signs the account in, since every OIDC endpoint answers 401 without a session. */
function signedIn() {
  storeSession(buildSession());

  server.use(
    http.post(buildAPITestURL(AuthEndpoints.check()), () => HttpResponse.json({})),

    http.get(buildAPITestURL(OrganizationEndpoints.list()), () =>
      HttpResponse.json({ count: 1, next: null, previous: null, results: [buildOrganization()] })
    ),

    http.get(`*/${OrganizationEndpoints.me(1)}`, () => HttpResponse.json(buildOrganizationMe()))
  );
}

/** Answers what the client is asking for. */
const clientAsksFor = ({
  authorizationNeeded = true,
  scopes = ['openid scope', 'email scope'],
} = {}) => {
  server.use(
    http.post(authorizationUrl, () =>
      HttpResponse.json({
        form_data: {
          application_name: 'Acme CI',
          scopes_descriptions: scopes,
          authorization_needed: authorizationNeeded,
        },
        validation_result: { valid: true, redirect_url: null, error: null },
      })
    )
  );
};

const openAuthorize = () => renderAtRoute(`/dashboard/oidc/authorize?oidc_token=${TOKEN}`);

describe('OidcAuthorizePage', () => {
  let assignedHref: string | undefined;

  beforeEach(() => {
    signedIn();
    clientAsksFor();

    assignedHref = undefined;

    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      set href(value: string) {
        assignedHref = value;
      },
      get href() {
        return 'https://dashboard.example.test/dashboard/oidc/authorize';
      },
    } as Location);

    server.use(
      http.post(authorizeUrl, () =>
        HttpResponse.json({ valid: true, redirect_url: GRANTED_CALLBACK, error: null })
      )
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the client name and the scopes it requests', async () => {
    await openAuthorize();

    expect(
      await screen.findByText(akMT('oidcModule.permissionHeading', { applicationName: 'Acme CI' }))
    ).toBeInTheDocument();

    expect(screen.getByText('openid scope')).toBeInTheDocument();
    expect(screen.getByText('email scope')).toBeInTheDocument();
  });

  it("posts allow true and redirects to the client's callback URL when the user authorizes", async () => {
    let sent: Record<string, unknown> | undefined;

    server.use(
      http.post(authorizeUrl, async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json({ valid: true, redirect_url: GRANTED_CALLBACK, error: null });
      })
    );

    await openAuthorize();
    await userEvent.click(await screen.findByRole('button', { name: akMT('authorize') }));

    await waitFor(() => expect(sent).toEqual({ oidc_token: TOKEN, allow: true }));
    await waitFor(() => expect(assignedHref).toBe(GRANTED_CALLBACK));
  });

  it("posts allow false and redirects to the client's callback URL when the user cancels", async () => {
    server.use(
      http.post(authorizeUrl, () =>
        HttpResponse.json(
          {
            valid: false,
            redirect_url: DENIED_CALLBACK,
            error: { code: 'access_denied', description: '' },
          },
          { status: HTTP_STATUS_CODES.BAD_REQUEST }
        )
      )
    );

    await openAuthorize();
    await userEvent.click(await screen.findByRole('button', { name: akMT('cancel') }));

    await waitFor(() => expect(assignedHref).toBe(DENIED_CALLBACK));
  });

  it('posts allow true without rendering the consent screen when the client skips authorization', async () => {
    clientAsksFor({ authorizationNeeded: false });

    let sent: Record<string, unknown> | undefined;

    server.use(
      http.post(authorizeUrl, async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json({ valid: true, redirect_url: GRANTED_CALLBACK, error: null });
      })
    );

    await openAuthorize();

    await waitFor(() => expect(sent).toEqual({ oidc_token: TOKEN, allow: true }));

    expect(screen.queryByRole('button', { name: akMT('authorize') })).not.toBeInTheDocument();
  });

  it("renders the API's error message when the authorize request is refused", async () => {
    server.use(
      http.post(authorizationUrl, () =>
        HttpResponse.json(
          {
            form_data: null,
            validation_result: {
              valid: false,
              redirect_url: null,
              error: { code: 'invalid_request', description: 'Invalid Client ID Parameter' },
            },
          },
          { status: HTTP_STATUS_CODES.BAD_REQUEST }
        )
      )
    );

    await openAuthorize();

    expect(await screen.findByText('Invalid Client ID Parameter')).toBeInTheDocument();
  });

  it('renders a notification when the decision request fails and carries no callback URL', async () => {
    server.use(
      http.post(authorizeUrl, () =>
        HttpResponse.json(
          {
            valid: false,
            redirect_url: null,
            error: { code: 'invalid_request', description: 'Invalid Client ID Parameter' },
          },
          { status: HTTP_STATUS_CODES.BAD_REQUEST }
        )
      )
    );

    await openAuthorize();
    await userEvent.click(await screen.findByRole('button', { name: akMT('authorize') }));

    expect(await screen.findByText('Invalid Client ID Parameter')).toBeInTheDocument();
  });

  it('does not navigate when the decision response carries no callback URL', async () => {
    server.use(
      http.post(authorizeUrl, () =>
        HttpResponse.json({ valid: true, redirect_url: null, error: null })
      )
    );

    await openAuthorize();
    await userEvent.click(await screen.findByRole('button', { name: akMT('authorize') }));

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: akMT('authorize') })).toBeInTheDocument()
    );

    expect(assignedHref).toBeUndefined();
  });

  it('renders the generic error message when the refusal carries no message', async () => {
    server.use(
      http.post(authorizeUrl, () =>
        HttpResponse.json(
          { valid: false, redirect_url: null, error: null },
          { status: HTTP_STATUS_CODES.BAD_REQUEST }
        )
      )
    );

    await openAuthorize();
    await userEvent.click(await screen.findByRole('button', { name: akMT('authorize') }));

    expect(await screen.findByText(akMT('somethingWentWrong'))).toBeInTheDocument();
  });
});
