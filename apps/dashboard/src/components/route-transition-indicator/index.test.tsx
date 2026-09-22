import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';

import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { Fragment } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { AuthEndpoints } from '@irene/api/services/auth/endpoints';
import { clearStoredSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';
import { TranslationsProvider } from '@irene/translations/provider';

import {
  RouteTransitionIndicator,
  type RouteTransitionVariant,
} from '@/components/route-transition-indicator';

import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

/** A page that asks the API for something that never answers. */
function PageWithPendingQuery() {
  useQuery({ queryKey: ['never'], queryFn: () => new Promise(() => undefined), retry: false });

  return <p>Third page</p>;
}

/**
 * Three pages under a layout that renders the indicator: one that loads at
 * once, one behind a loader the test finishes by hand, and one that fetches.
 */
function renderPages({ variant }: { variant?: RouteTransitionVariant } = {}) {
  let finishLoading: () => void = () => undefined;

  const loaded = new Promise<void>((resolve) => {
    finishLoading = () => resolve();
  });

  const root = createRootRoute({
    component: () => (
      <Fragment>
        <RouteTransitionIndicator variant={variant ?? 'wash'} />
        <Outlet />
      </Fragment>
    ),
  });

  const first = createRoute({
    getParentRoute: () => root,
    path: '/',
    component: () => <p>First page</p>,
  });

  const second = createRoute({
    getParentRoute: () => root,
    path: '/second',
    loader: () => loaded,
    component: () => <p>Second page</p>,
  });

  const third = createRoute({
    getParentRoute: () => root,
    path: '/third',
    component: PageWithPendingQuery,
  });

  const router = createRouter({
    routeTree: root.addChildren([first, second, third]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });

  render(
    <TranslationsProvider>
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </TranslationsProvider>
  );

  finishPendingNavigation = finishLoading;

  return { router, finishLoading };
}

/*
  A test that asserts mid-navigation leaves that navigation running. Finishing
  it here lets the router settle before the next test renders, rather than
  updating a tree that has already been unmounted.
*/
let finishPendingNavigation: (() => void) | null = null;

afterEach(async () => {
  finishPendingNavigation?.();
  finishPendingNavigation = null;

  await act(async () => undefined);
});

/** The spinner's live region, which is only named while a navigation is shown. */
const spinner = () => screen.queryByRole('status', { name: akMT('loading') });

const wash = () =>
  document.querySelector('[data-test-route-transition-indicator] > div:first-child');

describe('RouteTransitionIndicator, wash variant', () => {
  it('renders no spinner on the first load', async () => {
    renderPages();

    expect(await screen.findByText('First page')).toBeInTheDocument();
    expect(spinner()).not.toBeInTheDocument();
  });

  it('renders the spinner while the next page loads', async () => {
    const { router } = renderPages();

    await screen.findByText('First page');

    act(() => {
      router.navigate({ to: '/second' });
    });

    expect(await screen.findByRole('status', { name: akMT('loading') })).toBeInTheDocument();
  });

  it('marks the wash active while the next page loads', async () => {
    const { router } = renderPages();

    await screen.findByText('First page');

    act(() => {
      router.navigate({ to: '/second' });
    });

    await waitFor(() => expect(wash()).toHaveAttribute('data-active', 'true'));
  });

  it('keeps the previous page on screen while the next one loads', async () => {
    const { router } = renderPages();

    await screen.findByText('First page');

    act(() => {
      router.navigate({ to: '/second' });
    });

    await screen.findByRole('status', { name: akMT('loading') });

    expect(screen.getByText('First page')).toBeInTheDocument();
  });

  it('hides the spinner and the wash shortly after the next page renders', async () => {
    const { router, finishLoading } = renderPages();

    await screen.findByText('First page');

    act(() => {
      router.navigate({ to: '/second' });
    });

    await screen.findByRole('status', { name: akMT('loading') });

    await act(async () => finishLoading());

    expect(await screen.findByText('Second page')).toBeInTheDocument();

    await waitFor(() => expect(spinner()).not.toBeInTheDocument());

    expect(wash()).not.toHaveAttribute('data-active');
  });

  it('renders the spinner while the page fetches, not only while it navigates', async () => {
    const { router } = renderPages();

    await screen.findByText('First page');

    act(() => {
      router.navigate({ to: '/third' });
    });

    expect(await screen.findByText('Third page')).toBeInTheDocument();
    expect(await screen.findByRole('status', { name: akMT('loading') })).toBeInTheDocument();
  });
});

describe('RouteTransitionIndicator, bar variant', () => {
  const bar = () => document.querySelector('[data-test-route-transition-indicator]');
  const barValue = () => screen.getByRole<HTMLProgressElement>('progressbar').value;

  it('renders the bar idle once the first page has loaded', async () => {
    renderPages({ variant: 'bar' });

    expect(await screen.findByText('First page')).toBeInTheDocument();
    expect(bar()).not.toHaveAttribute('data-active');
    expect(bar()).toHaveAttribute('aria-hidden', 'true');
  });

  it('advances the bar while the next page loads, without reaching the end', async () => {
    const { router } = renderPages({ variant: 'bar' });

    await screen.findByText('First page');

    act(() => {
      router.navigate({ to: '/second' });
    });

    await waitFor(() => expect(barValue()).toBeGreaterThan(0));

    const started = barValue();

    await waitFor(() => expect(barValue()).toBeGreaterThan(started));

    expect(barValue()).toBeLessThan(100);
  });

  it('starts the next stretch of work from the beginning, never from the end', async () => {
    const { router, finishLoading } = renderPages({ variant: 'bar' });

    await screen.findByText('First page');

    act(() => {
      router.navigate({ to: '/second' });
    });

    await waitFor(() => expect(barValue()).toBeGreaterThan(0));

    await act(async () => finishLoading());

    await screen.findByText('Second page');
    await waitFor(() => expect(barValue()).toBe(100));

    const finished = document.querySelector('[data-slot="progress-linear"]');

    act(() => {
      router.navigate({ to: '/third' });
    });

    await waitFor(() => expect(barValue()).toBeLessThan(100));

    expect(document.querySelector('[data-slot="progress-linear"]')).not.toBe(finished);
  });

  it('completes the bar once the next page renders', async () => {
    const { router, finishLoading } = renderPages({ variant: 'bar' });

    await screen.findByText('First page');

    act(() => {
      router.navigate({ to: '/second' });
    });

    await waitFor(() => expect(barValue()).toBeGreaterThan(0));

    await act(async () => finishLoading());

    expect(await screen.findByText('Second page')).toBeInTheDocument();

    await waitFor(() => expect(barValue()).toBe(100));
  });

  it('marks the bar active while the next page loads', async () => {
    const { router } = renderPages({ variant: 'bar' });

    await screen.findByText('First page');

    act(() => {
      router.navigate({ to: '/second' });
    });

    await waitFor(() => expect(bar()).toHaveAttribute('data-active', 'true'));
  });

  it('marks the bar active while the page fetches', async () => {
    const { router } = renderPages({ variant: 'bar' });

    await screen.findByText('First page');

    act(() => {
      router.navigate({ to: '/third' });
    });

    expect(await screen.findByText('Third page')).toBeInTheDocument();

    await waitFor(() => expect(bar()).toHaveAttribute('data-active', 'true'));
  });

  it('marks the bar idle shortly after the next page renders', async () => {
    const { router, finishLoading } = renderPages({ variant: 'bar' });

    await screen.findByText('First page');

    act(() => {
      router.navigate({ to: '/second' });
    });

    await waitFor(() => expect(bar()).toHaveAttribute('data-active', 'true'));

    await act(async () => finishLoading());

    expect(await screen.findByText('Second page')).toBeInTheDocument();

    await waitFor(() => expect(bar()).not.toHaveAttribute('data-active'));
  });

  it('reports on a signed-out page too, since either side can be waiting', async () => {
    clearStoredSession();

    server.use(
      http.post(buildAPITestURL(AuthEndpoints.ssoCheck()), async () => {
        await delay('infinite');

        return HttpResponse.json({});
      })
    );

    const user = userEvent.setup();

    await renderAtRoute('/login');

    await user.type(screen.getByLabelText(akMT('usernameEmailIdTextLabel')), 'someone@test.com');
    await user.click(screen.getByRole('button', { name: akMT('next') }));

    await waitFor(() => expect(bar()).toHaveAttribute('data-active', 'true'));
  });
});
