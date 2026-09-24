import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthEndpoints } from '@irene/api/services/auth/endpoints';
import { OidcEndpoints } from '@irene/api/services/oidc/endpoints';
import { OrganizationEndpoints } from '@irene/api/services/organization/endpoints';
import { storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';
import type { ApiOidcValidationResult } from '@irene/api/services/oidc';

import { buildOrganization, buildOrganizationMe, buildSession } from '@tests/factories';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const TOKEN = 'signed-oidc-token';
const CLIENT_CALLBACK = 'https://client.example.test/callback?error=invalid_scope&state=123';

const validateUrl = buildAPITestURL(OidcEndpoints.validate());

/** Signs the account in, since every OIDC endpoint answers 401 without a session. */
function signedIn() {
  storeSession(buildSession());

  server.use(
    http.post(buildAPITestURL(AuthEndpoints.check()), () => HttpResponse.json({})),

    http.get(buildAPITestURL(OrganizationEndpoints.list()), () =>
      HttpResponse.json({ count: 1, next: null, previous: null, results: [buildOrganization()] })
    ),

    http.get(`*/${OrganizationEndpoints.me(1)}`, () => HttpResponse.json(buildOrganizationMe())),

    /* Answered so a test that reaches the consent screen does not hit a bare endpoint. */
    http.post(buildAPITestURL(OidcEndpoints.authorization()), () =>
      HttpResponse.json({
        form_data: {
          application_name: 'Acme CI',
          scopes_descriptions: ['openid scope'],
          authorization_needed: true,
        },
        validation_result: { valid: true, redirect_url: null, error: null },
      })
    )
  );
}

/** Answers the token check the way the API does for a refusal. */
const validationFailsWith = (body: ApiOidcValidationResult) => {
  server.use(
    http.post(validateUrl, () => HttpResponse.json(body, { status: HTTP_STATUS_CODES.BAD_REQUEST }))
  );
};

const openRedirect = () => renderAtRoute(`/dashboard/oidc/redirect?oidc_token=${TOKEN}`);

describe('OidcRedirectPage', () => {
  let assignedHref: string | undefined;

  beforeEach(() => {
    signedIn();

    assignedHref = undefined;

    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      set href(value: string) {
        assignedHref = value;
      },
      get href() {
        return 'https://dashboard.example.test/dashboard/oidc/redirect';
      },
    } as Location);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts the oidc_token from the URL to the validate endpoint', async () => {
    let sent: Record<string, unknown> | undefined;

    server.use(
      http.post(validateUrl, async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json({ valid: true, redirect_url: null, error: null });
      })
    );

    await openRedirect();

    await waitFor(() => expect(sent).toEqual({ oidc_token: TOKEN }));
  });

  it('navigates to the authorize screen once the token validates', async () => {
    server.use(
      http.post(validateUrl, () =>
        HttpResponse.json({ valid: true, redirect_url: null, error: null })
      )
    );

    const { router } = await openRedirect();

    await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard/oidc/authorize'));
  });

  it("redirects to the client's callback URL when the refusal carries one", async () => {
    validationFailsWith({
      valid: false,
      redirect_url: CLIENT_CALLBACK,
      error: { code: 'invalid_scope', description: 'Invalid Scope' },
    });

    await openRedirect();

    await waitFor(() => expect(assignedHref).toBe(CLIENT_CALLBACK));
  });

  it("renders the API's error message when the refusal carries no callback URL", async () => {
    validationFailsWith({
      valid: false,
      redirect_url: null,
      error: { code: 'invalid_oidc_token', description: 'Invalid OIDC Token' },
    });

    await openRedirect();

    expect(await screen.findByText('Invalid OIDC Token')).toBeInTheDocument();
    expect(screen.getByText(akMT('oidcModule.errorHelperTextSignedIn'))).toBeInTheDocument();
  });

  it('renders the generic invalid-token message when the refusal carries no message', async () => {
    validationFailsWith({ valid: false, redirect_url: null, error: null });

    await openRedirect();

    expect(await screen.findByText(akMT('somethingWentWrong'))).toBeInTheDocument();
  });
});
