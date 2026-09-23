import type { QueryClient } from '@tanstack/react-query';

import {
  dashboardConfigurationOptions,
  frontendConfigurationOptions,
  serverConfigurationOptions,
} from '@/queries/configuration';

import { configurationStore } from '@irene/api/stores/configuration';
import { getStoredSession } from '@irene/api/utils/session';

/**
 * Reads a settled configuration request, returning null when it rejected.
 *
 * A request that fails leaves the store on its defaults, rather than blocking
 * the page the configuration styles.
 *
 * @param result - The settled request.
 * @returns The configuration, or null when the request failed.
 */
function _resolveConfig<TConfig>(result: PromiseSettledResult<TConfig>): TConfig | null {
  return result.status === 'fulfilled' ? result.value : null;
}

/**
 * Fetches both deployment configurations and writes them to the store.
 *
 * They are requested in parallel, since neither depends on the other, and the
 * components that read them reserve space until they resolve.
 *
 * @param queryClient - The cache to load through.
 */
export async function loadConfiguration(queryClient: QueryClient) {
  const configuration = configurationStore.getState();

  const [frontendResult, serverResult] = await Promise.allSettled([
    queryClient.query(frontendConfigurationOptions()),
    queryClient.query(serverConfigurationOptions()),
  ]);

  configuration.setFrontendConfiguration(_resolveConfig(frontendResult));
  configuration.setServerConfiguration(_resolveConfig(serverResult));
}

/**
 * Fetches the organization's own configuration and writes it to the store.
 *
 * Answered only for a signed-in account, so it is skipped without a session
 * rather than requested and refused. A page outside the authenticated guard
 * calls this when it needs a host the organization may override, since the
 * signed-in setup that normally loads it has not run.
 *
 * @param queryClient - The cache to load through.
 */
export async function loadDashboardConfiguration(queryClient: QueryClient) {
  if (getStoredSession()) {
    const configStore = configurationStore.getState();

    try {
      const configuration = await queryClient.query(dashboardConfigurationOptions());
      configStore.setDashboardConfiguration(configuration);
    } catch {
      configStore.setDashboardConfiguration(null);
    }
  }
}
