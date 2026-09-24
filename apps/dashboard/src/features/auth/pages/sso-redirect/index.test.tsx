import { screen, waitFor } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { AuthEndpoints } from '@irene/api/services/auth';
import { akMT } from '@irene/translations/intl';

import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const SAML_LOGIN_URL = buildAPITestURL(AuthEndpoints.samlLogin());

/** Holds the token exchange open, so the route stays on its pending state. */
function holdTheExchange() {
  server.use(
    http.post(SAML_LOGIN_URL, async () => {
      await delay('infinite');

      return HttpResponse.json({});
    })
  );
}

describe('SsoRedirectPage', () => {
  it('renders the signing-in message', async () => {
    holdTheExchange();

    await renderAtRoute('/saml2/redirect?sso_token=tok3n', { settle: false });

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: akMT('signingYouIn') })).toBeInTheDocument()
    );

    expect(screen.getByText(akMT('completingSsoSignIn'))).toBeInTheDocument();
  });

  it('marks the message as a live region for screen readers', async () => {
    holdTheExchange();

    await renderAtRoute('/saml2/redirect?sso_token=tok3n', { settle: false });

    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument());
  });
});
