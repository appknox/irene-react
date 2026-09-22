import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { AuthEndpoints } from '@irene/api/services/auth/endpoints';
import { ConfigurationEndpoints } from '@irene/api/services/configuration/endpoints';
import { OrganizationEndpoints } from '@irene/api/services/organization/endpoints';
import { clearStoredSession, storeSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';

import { sessionCheckOptions } from '@/features/auth/queries/session';
import { buildSession } from '@tests/factories';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

/** The overlay's own element, which outlives the screen it covers. */
const overlay = () => document.querySelector('[data-test-boot-overlay]');

/** The overlay's own bar, told apart from the one across the top of the page. */
const barValue = () =>
  document.querySelector<HTMLProgressElement>(
    '[data-test-boot-overlay] [data-slot="progress-linear"]'
  )?.value;

/** Holds one of the calls the boot waits on. */
const hold = (url: string, method: 'get' | 'post' = 'get') => {
  server.use(
    http[method](url, async () => {
      await delay('infinite');

      return HttpResponse.json({});
    })
  );
};

describe('BootOverlay', () => {
  it('covers the session check, which runs before anything renders', async () => {
    storeSession(buildSession());
    hold(buildAPITestURL(AuthEndpoints.check()), 'post');

    await renderAtRoute('/', { settle: false });

    expect(await screen.findByRole('status', {}, { timeout: 2000 })).toHaveAccessibleName(
      akMT('loadingTheDashboard')
    );
  });

  it('covers the install describing itself', async () => {
    storeSession(buildSession());
    hold(buildAPITestURL(ConfigurationEndpoints.frontend()));

    await renderAtRoute('/', { settle: false });

    await waitFor(() => expect(overlay()).toBeInTheDocument());
  });

  it('covers the signed-in setup that follows', async () => {
    storeSession(buildSession());
    hold(buildAPITestURL(OrganizationEndpoints.list()));

    await renderAtRoute('/', { settle: false });

    await waitFor(() => expect(overlay()).toBeInTheDocument());
  });

  it('completes its bar before it goes, rather than vanishing part way', async () => {
    storeSession(buildSession());

    await renderAtRoute('/', { settle: false });

    await waitFor(() => expect(barValue()).toBe(100));
    await waitFor(() => expect(overlay()).not.toBeInTheDocument());
  });

  it('covers the setup that follows signing in, having started on the login page', async () => {
    clearStoredSession();

    const { router, queryClient } = await renderAtRoute('/login');

    expect(overlay()).not.toBeInTheDocument();

    // What signing in does: stores the session and seeds the cache with it.
    const session = buildSession();

    storeSession(session);
    queryClient.setQueryData(sessionCheckOptions().queryKey, session);
    hold(buildAPITestURL(OrganizationEndpoints.list()));

    act(() => {
      router.navigate({ to: '/' });
    });

    await waitFor(() => expect(overlay()).toBeInTheDocument());
  });

  it('covers a second sign-in in the same tab, after signing out of the first', async () => {
    storeSession(buildSession());

    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.list()), () =>
        HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
      ),
      http.post(buildAPITestURL(AuthEndpoints.logout()), () => HttpResponse.json({}))
    );

    const { router, queryClient } = await renderAtRoute('/');

    await waitFor(() => expect(overlay()).not.toBeInTheDocument());

    await userEvent.click(await screen.findByRole('button', { name: 'Logout' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));

    // What signing in does: stores the session and seeds the cache with it.
    const session = buildSession();

    storeSession(session);
    queryClient.setQueryData(sessionCheckOptions().queryKey, session);
    hold(buildAPITestURL(OrganizationEndpoints.list()));

    act(() => {
      router.navigate({ to: '/' });
    });

    await waitFor(() => expect(overlay()).toBeInTheDocument());
  });

  it('renders nothing for a visitor with no session to restore', async () => {
    clearStoredSession();
    hold(buildAPITestURL(ConfigurationEndpoints.frontend()));

    await renderAtRoute('/login', { settle: false });

    expect(overlay()).not.toBeInTheDocument();
  });
});
