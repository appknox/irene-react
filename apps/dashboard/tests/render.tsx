import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
  type AnyRouter,
} from '@tanstack/react-router';

import { QueryClientProvider } from '@tanstack/react-query';
import { act, render, type RenderOptions } from '@testing-library/react';
import type { ReactNode } from 'react';

import { queryClient } from '@irene/api';
import { TranslationsProvider } from '@irene/translations/provider';
import { AkToaster } from '@irene/ui/ak-toaster';

import { BootOverlay } from '@/components/boot-overlay';
import { IRENE_DASHBOARD_ROUTER_DEFAULTS } from '@/router';
import type { RootRouterContext } from '@/routes/__root';

/*
  A route failure is the subject of several tests, and the router's own boundary
  reports it on screen. React still logs every error a boundary caught, which
  would fill the run with stack traces for failures the tests asked for.
*/
const RENDER_OPTIONS: RenderOptions = { onCaughtError: () => undefined };

/** Renders inside the providers the app supplies, with a cache per test. */
export function renderWithProviders(ui: ReactNode) {
  queryClient.clear();

  return {
    queryClient,
    ...render(
      <TranslationsProvider>
        <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
      </TranslationsProvider>,
      RENDER_OPTIONS
    ),
  };
}

/** What a route render may vary. */
interface RenderAtRouteOptions {
  settle?: boolean;
  context?: RootRouterContext;
}

/**
 * Renders the app at one URL, through the real route tree. Use it for a page
 * that reads search params or navigates; `renderWithProviders` is enough for a
 * component that does neither.
 *
 * @param path - The URL to start at, e.g. `/login?unauthenticated=true`.
 * @param options.settle - Whether to wait for guards and loaders. Pass false to
 * assert what the route shows while its loader is still in flight.
 * @param options.context - Router context to start with. Defaults to the app's
 * own cache; pass one to give a test a cache of its own.
 * @returns The testing-library result, plus the router and cache.
 */
export async function renderAtRoute(
  path: string,
  { settle = true, context }: RenderAtRouteOptions = {}
) {
  queryClient.clear();

  const routerContext = context ?? { queryClient };

  const router: AnyRouter = createRouter({
    ...IRENE_DASHBOARD_ROUTER_DEFAULTS,
    context: routerContext,
    history: createMemoryHistory({ initialEntries: [path] }),
  });

  // Route guards and loaders run before the first paint, so let them settle
  // rather than leaving every test to wait the page out.
  if (settle) {
    await router.load();
  }

  const rendered = render(
    <TranslationsProvider>
      <QueryClientProvider client={routerContext.queryClient}>
        <RouterProvider router={router} />
        <BootOverlay router={router} />
        <AkToaster />
      </QueryClientProvider>
    </TranslationsProvider>,
    RENDER_OPTIONS
  );

  /*
    A guard that redirects finishes after the first paint, so let the queue
    drain here rather than having React report it as an update outside a test.
  */
  await act(async () => undefined);

  return { queryClient: routerContext.queryClient, router, ...rendered };
}
