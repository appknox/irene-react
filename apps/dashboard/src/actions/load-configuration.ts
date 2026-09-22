import type { QueryClient } from '@tanstack/react-query';

import { configurationStore } from '@irene/api/stores/configuration';
import { frontendConfigurationOptions, serverConfigurationOptions } from '@/queries/configuration';

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
