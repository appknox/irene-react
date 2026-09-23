import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { clearStoredSession, storeSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';

import { buildSession } from '@tests/factories';
import { renderAtRoute } from '@tests/render';

describe('RouteNotFound', () => {
  it('is shown for a URL that matches no route', async () => {
    clearStoredSession();

    await renderAtRoute('/not-a-real-page');

    expect(await screen.findByText(akMT('pageNotFound'))).toBeInTheDocument();
  });

  it('is shown to a signed-in user too, since a bad URL is not a guard failure', async () => {
    storeSession(buildSession());

    await renderAtRoute('/dashboard/not-a-real-page');

    expect(await screen.findByText(akMT('pageNotFound'))).toBeInTheDocument();
  });

  it('says why the page may be missing, beyond that it is', async () => {
    clearStoredSession();

    await renderAtRoute('/not-a-real-page');

    expect(await screen.findByText(akMT('pageNotFoundHint'))).toBeInTheDocument();
  });

  it('offers the way home', async () => {
    clearStoredSession();

    const { router } = await renderAtRoute('/not-a-real-page');

    await userEvent.click(await screen.findByRole('link', { name: akMT('gotoHome') }));

    await waitFor(() => expect(router.state.location.pathname).not.toBe('/not-a-real-page'));
  });

  it('replaces the unresolved URL, so back does not return to it', async () => {
    clearStoredSession();

    const { router } = await renderAtRoute('/not-a-real-page');

    await userEvent.click(await screen.findByRole('link', { name: akMT('gotoHome') }));

    await waitFor(() => expect(router.state.location.pathname).not.toBe('/not-a-real-page'));

    expect(router.history).toHaveLength(1);
  });
});
