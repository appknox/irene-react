import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import { AuthEndpoints } from '@irene/api/services/auth';
import { storeSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';

import { buildSession } from '@tests/factories';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const session = buildSession();

/** Let the session check pass, so the authenticated pages render. */
const signedIn = () => {
  storeSession(session);
  server.use(http.post(buildAPITestURL(AuthEndpoints.check()), () => HttpResponse.json({})));
};

afterEach(() => {
  window.localStorage.clear();
});

describe('the browser tab', () => {
  it('names the page it is showing, then the product', async () => {
    signedIn();

    await renderAtRoute('/');

    await waitFor(() => expect(document.title).toBe(`${akMT('home')} | Appknox`));
  });

  it('names a page nobody has signed in for', async () => {
    await renderAtRoute('/login');

    await waitFor(() => expect(document.title).toBe(`${akMT('login')} | Appknox`));
  });

  it('shows the product alone on a page that names none', async () => {
    await renderAtRoute('/no-such-page');

    await waitFor(() => expect(document.title).toBe('Appknox'));
  });
});
