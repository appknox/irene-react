import { apiRequest } from '@irene/api/request';

import type {
  ApiFrontendConfiguration,
  ApiServerConfiguration,
} from '@irene/api/services/configuration';

import { ConfigurationEndpoints } from './endpoints';

/**
 * Talks to the endpoints describing the deployment.
 *
 * Both run at boot, before the first page paints and before anyone has signed
 * in, because a whitelabel deployment's login page is branded too.
 */
export default class ConfigurationService {
  /**
   * Fetches how this deployment presents itself.
   * @returns The branding, theme and integration keys.
   */
  public static readonly getFrontendConfiguration = () =>
    apiRequest.get<ApiFrontendConfiguration>(ConfigurationEndpoints.frontend());

  /**
   * Fetches what the backend provides.
   * @returns The socket address, device farm host, and whether this is an enterprise install.
   */
  public static readonly getServerConfiguration = () =>
    apiRequest.get<ApiServerConfiguration>(ConfigurationEndpoints.server());
}
