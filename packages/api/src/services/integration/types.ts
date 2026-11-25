/** The GitHub account an organization is connected through, as the endpoint names it. */
export interface ApiGithubIntegratedUser {
  avatar_url: string;
  created_on: string;
  html_url: string;
  login: string;
  name: string | null;
  updated_on: string;
}

/** Where to send the account to give a service's consent. */
export interface ApiIntegrationRedirect {
  url: string;
}

/**
 * What an organization's GitHub connection amounts to.
 *
 * `reconnect` is the 400 the endpoint answers with when a connection exists but
 * its token no longer works, which irene reads as a connection to make again
 * rather than as a failure.
 */
export interface GithubIntegration {
  integratedUser: ApiGithubIntegratedUser | null;
  reconnect: boolean;
}

/** The Jira account an organization is connected through. */
export interface ApiJiraIntegration {
  host: string;
  username: string;
  is_data_center?: boolean;
}

/** What is sent to connect a Jira account. */
export interface JiraIntegrationRequest {
  host: string;
  username: string;
  password: string;
  is_data_center: boolean;
}

/**
 * How far the Jira Security connection has got.
 *
 * `awaiting_jira` is a secret minted here that Jira has not yet used, which is
 * the state the panel walks an administrator out of.
 */
export type JiraSecurityStatus = 'not_connected' | 'awaiting_jira' | 'connected';

/** The Jira Security connection, as the endpoint reports it. */
export interface ApiJiraSecurity {
  status: JiraSecurityStatus;
  connected_on: string | null;
  configure_path: string | null;
  auto_push: boolean;
}

/** The shared secret Jira is given, which is shown once. */
export interface ApiJiraSecuritySecret {
  secret: string;
}

/** The ServiceNow instance an organization is connected to. */
export interface ApiServiceNowIntegration {
  id: number;
  instance_url: string;
  username: string;
  table_name: string;
  created_on: string;
  updated_on: string;
}

/** What is sent to connect a ServiceNow instance. */
export interface ServiceNowIntegrationRequest {
  instance_url: string;
  username: string;
  password: string;
  table_name: number;
}

/** The Slack channel an organization sends to. A connection needs both fields. */
export interface ApiSlackIntegration {
  channel_id: string;
  api_token: string;
}

/** The Splunk instance an organization sends to, and what it writes where. */
export interface ApiSplunkIntegration {
  id: number;
  instance_url: string;
  hec_token: string;
  api_token: string;
  vulnerability_index: string;
  send_user_logs: boolean;
  user_logs_index: string;
  log_frequency_hours: number;
  created_on: string;
  updated_on: string;
}

/** What is sent to connect a Splunk instance, or to change what it writes. */
export interface SplunkIntegrationRequest {
  instance_url: string;
  hec_token: string;
  api_token: string;
  vulnerability_index: string;
  send_user_logs: boolean;
  user_logs_index: string;
  log_frequency_hours: number;
}
