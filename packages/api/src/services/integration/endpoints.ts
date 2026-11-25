import { API_NAMESPACES } from '@irene/api/namespaces';

/** Where one organization's integrations live, which every path here hangs off. */
const organization = (organizationId: number | string) =>
  `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}` as const;

/** Paths for the services an organization connects itself to. */
export const IntegrationEndpoints = {
  /** The GitHub account an organization has connected, which is also revoked here. */
  github: (organizationId: number | string) => `${organization(organizationId)}/github` as const,

  /** Where GitHub's own consent screen is asked for. */
  githubRedirect: (organizationId: number | string) =>
    `${organization(organizationId)}/github/redirect` as const,

  /** The Jira account an organization has connected: read, set and revoked here. */
  jira: (organizationId: number | string) =>
    `${organization(organizationId)}/integrate_jira` as const,

  /**
   * The Jira Security connection, which Jira itself completes.
   *
   * The same path answers its state, mints the shared secret, sets whether
   * findings are pushed as they change, and takes the connection down.
   */
  jiraSecurity: (organizationId: number | string) =>
    `${organization(organizationId)}/jira_security` as const,

  /** The ServiceNow instance an organization has connected. */
  serviceNow: (organizationId: number | string) =>
    `${organization(organizationId)}/servicenow` as const,

  /** The Slack channel an organization sends to, and the token behind it. */
  slack: (organizationId: number | string) => `${organization(organizationId)}/slack` as const,

  /** Where Slack's own consent screen is asked for. */
  slackRedirect: (organizationId: number | string) =>
    `${organization(organizationId)}/slack/redirect` as const,

  /** The Splunk instance an organization sends to, with the indexes it writes into. */
  splunk: (organizationId: number | string) => `${organization(organizationId)}/splunk` as const,

  /** The indexes that Splunk instance holds, which the configuration is chosen from. */
  splunkIndexes: (organizationId: number | string) =>
    `${organization(organizationId)}/splunk/indexes` as const,
};
