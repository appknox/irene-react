import { createRootRouteWithContext } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';

import { configurationStore } from '@irene/api/stores/configuration';

import type {
  ApiFrontendConfiguration,
  ApiServerConfiguration,
} from '@irene/api/services/configuration';

import { sessionCheckOptions } from '@/features/auth/queries/session';
import { RootLayout } from '@/layouts/root-layout';
import { frontendConfigurationOptions, serverConfigurationOptions } from '@/queries/configuration';

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
    const configuration = configurationStore.getState();

    // Confirm the session token is still valid
    await context.queryClient.query(sessionCheckOptions());

    // Both are settled once per tab, so a later navigation asks for neither.
    if (configuration.hasFetchedFrontend && configuration.hasFetchedServer) {
      return;
    }

    // Asked for together: neither describes the other, so neither waits for it.
    const [frontendConfigResult, serverConfigResult] = await Promise.allSettled([
      context.queryClient.query(frontendConfigurationOptions()),
      context.queryClient.query(serverConfigurationOptions()),
    ]);

    configuration.setFrontendConfiguration(resolveConfigResult(frontendConfigResult));
    configuration.setServerConfiguration(resolveConfigResult(serverConfigResult));
  },

  component: RootLayout,
});

/**
 * Resolves a configuration result to a configuration object or null.
 * @param status - The result of a configuration query.
 * @returns The configuration object or null.
 */
function resolveConfigResult<T extends ApiFrontendConfiguration | ApiServerConfiguration>(
  status: PromiseSettledResult<T>
): T | null {
  return status.status === 'fulfilled' ? status.value : null;
}
