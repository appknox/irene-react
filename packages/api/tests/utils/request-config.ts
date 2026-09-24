import type { InternalAxiosRequestConfig } from 'axios';
import { client } from '@irene/api/request';

/**
 * Records the config every request goes out with, which is where options such
 * as the timeout ride. The interceptor is ejected when `stop` is called, so one
 * test's recording does not outlive it.
 *
 * @returns The configs recorded so far, and the way to stop recording.
 */
export function recordRequestConfigs() {
  const configs: InternalAxiosRequestConfig[] = [];

  const interceptor = client.interceptors.request.use((config) => {
    configs.push(config);

    return config;
  });

  return {
    configs,
    latest: () => configs.at(-1),
    stop: () => client.interceptors.request.eject(interceptor),
  };
}
