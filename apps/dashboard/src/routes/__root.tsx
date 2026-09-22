import { createRootRouteWithContext } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';

import { configurationStore } from '@irene/api/stores/configuration';
import { getLocale, setLocale } from '@irene/translations/intl';
import { getStoredLocale } from '@irene/translations/locale';

import { loadConfiguration } from '@/actions/load-configuration';
import { sessionCheckOptions } from '@/features/auth/queries/session';
import { RootLayout } from '@/layouts/root-layout';

/**
 * This context is passed to every route, whatever its depth.
 *
 * The cache is also passed rather than imported so a guard or loader reads the same
 * one the components do, and so a test can hand the router its own.
 *
 * @interface RootRouterContext
 * @property {QueryClient} queryClient - The cache every guard and loader queries through.
 */
export interface RootRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RootRouterContext>()({
  beforeLoad: async ({ context }) => {
    // The language this browser chose, until an account with one of its own signs in.
    const storedLocale = getStoredLocale();
    const configuration = configurationStore.getState();

    // Set the language to the browser's choice, if it is not the default.
    if (storedLocale && storedLocale !== getLocale()) {
      await setLocale(storedLocale);
    }

    // Confirm the session token is still valid
    await context.queryClient.query(sessionCheckOptions());

    // Both are settled once per tab, so a later navigation asks for neither.
    if (configuration.hasFetchedFrontend && configuration.hasFetchedServer) {
      return;
    }

    /*
      Started, not awaited. The page is fetched and rendered while the
      configuration requests are in flight, rather than after them: the
      components that read the configuration reserve space until it resolves.
    */
    loadConfiguration(context.queryClient);
  },

  component: RootLayout,
});
