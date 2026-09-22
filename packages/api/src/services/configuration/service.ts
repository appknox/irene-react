import { apiRequest } from '@irene/api/request';

import type {
  ApiDashboardConfig,
  ApiFrontendConfiguration,
  ApiServerConfiguration,
} from '@irene/api/services/configuration';

import { ConfigurationEndpoints } from './endpoints';

/**
 * Talks to the endpoints describing the deployment.
 *
 * The first two run at application boot, before the first page paints and before anyone
 * has signed in, because a whitelabel deployment's login page is branded too.
 * The third describes one organization, so it waits for a session.
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

  /**
   * Fetches the hosts this organization's product links out to.
   * @returns The dashboard and device farm URLs.
   */
  public static readonly getDashboardConfiguration = () =>
    apiRequest.get<ApiDashboardConfig>(ConfigurationEndpoints.dashboard());
}
