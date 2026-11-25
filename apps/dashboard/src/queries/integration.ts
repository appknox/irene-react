import { queryOptions } from '@tanstack/react-query';
import { IntegrationService } from '@irene/api/services/integration';

/** The cache keys for the services an organization connects itself to. */
export const integrationKeys = {
  all: () => ['integration'] as const,

  service: (orgId: number | undefined, service: string) =>
    [...integrationKeys.all(), orgId, service] as const,

  github: (orgId: number | undefined) => integrationKeys.service(orgId, 'github'),
  jira: (orgId: number | undefined) => integrationKeys.service(orgId, 'jira'),
  jiraSecurity: (orgId: number | undefined) => integrationKeys.service(orgId, 'jira-security'),
  serviceNow: (orgId: number | undefined) => integrationKeys.service(orgId, 'service-now'),
  slack: (orgId: number | undefined) => integrationKeys.service(orgId, 'slack'),
  splunk: (orgId: number | undefined) => integrationKeys.service(orgId, 'splunk'),

  /** The indexes a connected Splunk instance holds, read only once it is connected. */
  splunkIndexes: (orgId: number | undefined) =>
    [...integrationKeys.service(orgId, 'splunk'), 'indexes'] as const,
};

/**
 * Builds the query for the GitHub account an organization is connected through.
 *
 * @param orgId - The organization to ask about, absent until one is selected.
 * @returns Query options resolving to the connected account, or to none.
 */
export const githubIntegrationOptions = (orgId: number | undefined) =>
  queryOptions({
    queryKey: integrationKeys.github(orgId),
    queryFn: () => IntegrationService.getGithubIntegration(Number(orgId)),
    enabled: orgId !== undefined,
  });

/**
 * Builds the query for the Jira account an organization is connected through.
 *
 * @param orgId - The organization to ask about, absent until one is selected.
 * @returns Query options resolving to the connection, or to none.
 */
export const jiraIntegrationOptions = (orgId: number | undefined) =>
  queryOptions({
    queryKey: integrationKeys.jira(orgId),
    queryFn: () => IntegrationService.getJiraIntegration(Number(orgId)),
    enabled: orgId !== undefined,
  });

/**
 * Builds the query for how far the Jira Security connection has got.
 *
 * @param orgId - The organization to ask about, absent until one is selected.
 * @returns Query options resolving to the connection's state.
 */
export const jiraSecurityOptions = (orgId: number | undefined) =>
  queryOptions({
    queryKey: integrationKeys.jiraSecurity(orgId),
    queryFn: () => IntegrationService.getJiraSecurity(Number(orgId)),
    enabled: orgId !== undefined,
  });

/**
 * Builds the query for the ServiceNow instance an organization is connected to.
 *
 * @param orgId - The organization to ask about, absent until one is selected.
 * @returns Query options resolving to the connection, or to none.
 */
export const serviceNowIntegrationOptions = (orgId: number | undefined) =>
  queryOptions({
    queryKey: integrationKeys.serviceNow(orgId),
    queryFn: () => IntegrationService.getServiceNowIntegration(Number(orgId)),
    enabled: orgId !== undefined,
  });

/**
 * Builds the query for the Slack channel an organization sends to.
 *
 * @param orgId - The organization to ask about, absent until one is selected.
 * @returns Query options resolving to the connection, or to none.
 */
export const slackIntegrationOptions = (orgId: number | undefined) =>
  queryOptions({
    queryKey: integrationKeys.slack(orgId),
    queryFn: () => IntegrationService.getSlackIntegration(Number(orgId)),
    enabled: orgId !== undefined,
  });

/**
 * Builds the query for the Splunk instance an organization sends to.
 *
 * @param orgId - The organization to ask about, absent until one is selected.
 * @returns Query options resolving to the connection, or to none.
 */
export const splunkIntegrationOptions = (orgId: number | undefined) =>
  queryOptions({
    queryKey: integrationKeys.splunk(orgId),
    queryFn: () => IntegrationService.getSplunkIntegration(Number(orgId)),
    enabled: orgId !== undefined,
  });

/**
 * Builds the query for the indexes the connected Splunk instance holds.
 *
 * Asked for only once the instance answers, since the indexes are read through
 * the connection's own tokens.
 *
 * @param orgId - The organization to ask about, absent until one is selected.
 * @param isConnected - Whether an instance is connected to ask.
 * @returns Query options resolving to the indexes a configuration may write into.
 */
export const splunkIndexesOptions = (orgId: number | undefined, isConnected: boolean) =>
  queryOptions({
    queryKey: integrationKeys.splunkIndexes(orgId),
    queryFn: () => IntegrationService.getSplunkIndexes(Number(orgId)),
    enabled: orgId !== undefined && isConnected,
  });
