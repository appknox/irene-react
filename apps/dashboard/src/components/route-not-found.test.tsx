import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { clearStoredSession, storeSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';

import { buildSession } from '@tests/factories';
import { renderAtRoute } from '@tests/render';

describe('RouteNotFound', () => {
  it('renders for a URL that matches no route', async () => {
    clearStoredSession();

    await renderAtRoute('/not-a-real-page');

    expect(await screen.findByText(akMT('pageNotFound'))).toBeInTheDocument();
  });

  it('renders for a signed-in user, rather than redirecting through the auth guard', async () => {
    storeSession(buildSession());

    await renderAtRoute('/dashboard/not-a-real-page');

    expect(await screen.findByText(akMT('pageNotFound'))).toBeInTheDocument();
  });

  it('renders the subtext explaining the page may have been moved or deleted', async () => {
    clearStoredSession();

    await renderAtRoute('/not-a-real-page');

    expect(await screen.findByText(akMT('pageNotFoundHint'))).toBeInTheDocument();
  });

  it('renders a link back to the home page', async () => {
    clearStoredSession();

    const { router } = await renderAtRoute('/not-a-real-page');

    await userEvent.click(await screen.findByRole('link', { name: akMT('gotoHome') }));

    await waitFor(() => expect(router.state.location.pathname).not.toBe('/not-a-real-page'));
  });

  it('replaces the unresolved URL in history, so the back button does not return to it', async () => {
    clearStoredSession();

    const { router } = await renderAtRoute('/not-a-real-page');

    await userEvent.click(await screen.findByRole('link', { name: akMT('gotoHome') }));

    await waitFor(() => expect(router.state.location.pathname).not.toBe('/not-a-real-page'));

    expect(router.history).toHaveLength(1);
  });
});
