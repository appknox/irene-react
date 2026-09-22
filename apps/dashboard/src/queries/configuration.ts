import { queryOptions } from '@tanstack/react-query';
import { ConfigurationService } from '@irene/api/services/configuration';

/** Keys for what the deployment says about itself. */
export const configurationKeys = {
  all: () => ['configuration'] as const,
  frontend: () => [...configurationKeys.all(), 'frontend'] as const,
  server: () => [...configurationKeys.all(), 'server'] as const,
  dashboard: () => [...configurationKeys.all(), 'dashboard'] as const,
};

/**
 * Builds the query for how this deployment presents itself.
 *
 * Answered before anyone signs in, since the login page is branded too, and
 * held for the life of the tab because a deployment does not rebrand itself
 * mid-session.
 *
 * @returns Query options resolving to the branding, theme and integration keys.
 */
export const frontendConfigurationOptions = () =>
  queryOptions({
    queryKey: configurationKeys.frontend(),
    queryFn: () => ConfigurationService.getFrontendConfiguration(),
    staleTime: Infinity,
    retry: false,
  });

/**
 * Builds the query for what the backend provides.
 *
 * @returns Query options resolving to the socket address and device farm host.
 */
export const serverConfigurationOptions = () =>
  queryOptions({
    queryKey: configurationKeys.server(),
    queryFn: () => ConfigurationService.getServerConfiguration(),
    staleTime: Infinity,
    retry: false,
  });

/**
 * Builds the query for the hosts this organization links out to.
 *
 * Answers only for a signed-in account, so it runs with the session setup
 * rather than at boot with the other two.
 *
 * @returns Query options resolving to the dashboard and device farm URLs.
 */
export const dashboardConfigurationOptions = () =>
  queryOptions({
    queryKey: configurationKeys.dashboard(),
    queryFn: () => ConfigurationService.getDashboardConfiguration(),
    staleTime: Infinity,
  });
