import { HTTP_STATUS_CODES } from '@irene/constants';
import { apiRequest } from '@irene/api/request';
import { getApiErrorStatus } from '@irene/api/utils/errors';

import { IntegrationEndpoints } from './endpoints';

import type {
  ApiIntegrationRedirect,
  ApiJiraIntegration,
  ApiJiraSecurity,
  ApiJiraSecuritySecret,
  ApiServiceNowIntegration,
  ApiSlackIntegration,
  ApiSplunkIntegration,
  GithubIntegration,
  JiraIntegrationRequest,
  ServiceNowIntegrationRequest,
  SplunkIntegrationRequest,
} from './types';

/**
 * Reads a connection that the endpoint answers with a 404 when there is none.
 *
 * Every integration but GitHub reports "nothing connected" that way, and irene
 * reads each of those 404s as an empty card rather than as a failure.
 *
 * @param read - Fetches the connection.
 * @returns The connection, or nothing where none is held.
 */
async function _readOptionalConnection<TConnection>(
  read: () => Promise<TConnection>
): Promise<TConnection | null> {
  try {
    return await read();
  } catch (error) {
    if (getApiErrorStatus(error) === HTTP_STATUS_CODES.NOT_FOUND) {
      return null;
    }

    throw error;
  }
}

/** Talks to the endpoints behind an organization's integrations. */
export default class IntegrationService {
  /**
   * Reads the GitHub account an organization is connected through.
   *
   * A 400 means the connection is there but its token no longer works, which is
   * reported as `reconnect` rather than thrown: the card then offers the
   * connection again instead of claiming none exists.
   *
   * @param organizationId - Whose connection to read.
   * @returns The connected account, and whether it has to be made again.
   */
  public static readonly getGithubIntegration = async (
    organizationId: number | string
  ): Promise<GithubIntegration> => {
    try {
      const integratedUser = await apiRequest.get<GithubIntegration['integratedUser']>(
        IntegrationEndpoints.github(organizationId)
      );

      return { integratedUser: integratedUser ?? null, reconnect: false };
    } catch (error) {
      if (getApiErrorStatus(error) === HTTP_STATUS_CODES.BAD_REQUEST) {
        return { integratedUser: null, reconnect: true };
      }

      throw error;
    }
  };

  /**
   * Asks where to send the account for GitHub's consent.
   *
   * @param organizationId - Which organization is connecting.
   * @returns The URL to leave for.
   */
  public static readonly getGithubRedirectUrl = async (organizationId: number | string) => {
    const { url } = await apiRequest.get<ApiIntegrationRedirect>(
      IntegrationEndpoints.githubRedirect(organizationId)
    );

    return url;
  };

  /**
   * Revokes an organization's GitHub connection.
   *
   * @param organizationId - Whose connection to revoke.
   */
  public static readonly revokeGithubIntegration = (organizationId: number | string) =>
    apiRequest.delete(IntegrationEndpoints.github(organizationId));

  /**
   * Reads the Jira account an organization is connected through.
   *
   * @param organizationId - Whose connection to read.
   * @returns The connected account, or nothing where none is held.
   */
  public static readonly getJiraIntegration = (organizationId: number | string) =>
    _readOptionalConnection(() =>
      apiRequest.get<ApiJiraIntegration>(IntegrationEndpoints.jira(organizationId))
    );

  /**
   * Connects a Jira account.
   *
   * @param organizationId - Which organization is connecting.
   * @param details - The host, the account, its credential, and whether the host is a data centre.
   */
  public static readonly setJiraIntegration = (
    organizationId: number | string,
    details: JiraIntegrationRequest
  ) => apiRequest.post(IntegrationEndpoints.jira(organizationId), details);

  /**
   * Revokes an organization's Jira connection.
   *
   * @param organizationId - Whose connection to revoke.
   */
  public static readonly revokeJiraIntegration = (organizationId: number | string) =>
    apiRequest.delete(IntegrationEndpoints.jira(organizationId));

  /**
   * Reads how far the Jira Security connection has got.
   *
   * A failure is reported as nothing connected, as irene reports it: the panel
   * then opens on its first step rather than on an error.
   *
   * @param organizationId - Whose connection to read.
   * @returns The connection's state.
   */
  public static readonly getJiraSecurity = (organizationId: number | string) =>
    apiRequest.get<ApiJiraSecurity>(IntegrationEndpoints.jiraSecurity(organizationId));

  /**
   * Mints the shared secret Jira is given.
   *
   * It is answered once and never read back, so the panel shows it until the
   * drawer closes and offers it again rather than recalling it.
   *
   * @param organizationId - Which organization is connecting.
   * @returns The secret.
   */
  public static readonly generateJiraSecuritySecret = async (organizationId: number | string) => {
    const { secret } = await apiRequest.post<ApiJiraSecuritySecret>(
      IntegrationEndpoints.jiraSecurity(organizationId)
    );

    return secret;
  };

  /**
   * Sets whether findings reach Jira as they change rather than on a report.
   *
   * @param organizationId - Whose connection to set it on.
   * @param autoPush - Whether to push as findings change.
   */
  public static readonly setJiraSecurityAutoPush = (
    organizationId: number | string,
    autoPush: boolean
  ) =>
    apiRequest.patch(IntegrationEndpoints.jiraSecurity(organizationId), {
      auto_push: autoPush,
    });

  /**
   * Takes the Jira Security connection down.
   *
   * @param organizationId - Whose connection to take down.
   */
  public static readonly revokeJiraSecurity = (organizationId: number | string) =>
    apiRequest.delete(IntegrationEndpoints.jiraSecurity(organizationId));

  /**
   * Reads the ServiceNow instance an organization is connected to.
   *
   * @param organizationId - Whose connection to read.
   * @returns The connection, or nothing where none is held.
   */
  public static readonly getServiceNowIntegration = (organizationId: number | string) =>
    _readOptionalConnection(() =>
      apiRequest.get<ApiServiceNowIntegration>(IntegrationEndpoints.serviceNow(organizationId))
    );

  /**
   * Connects a ServiceNow instance.
   *
   * @param organizationId - Which organization is connecting.
   * @param details - The instance, the account, its password, and the table to raise items in.
   */
  public static readonly setServiceNowIntegration = (
    organizationId: number | string,
    details: ServiceNowIntegrationRequest
  ) => apiRequest.post(IntegrationEndpoints.serviceNow(organizationId), details);

  /**
   * Revokes an organization's ServiceNow connection.
   *
   * @param organizationId - Whose connection to revoke.
   */
  public static readonly revokeServiceNowIntegration = (organizationId: number | string) =>
    apiRequest.delete(IntegrationEndpoints.serviceNow(organizationId));

  /**
   * Reads the Slack channel an organization sends to.
   *
   * @param organizationId - Whose connection to read.
   * @returns The channel and the token behind it, or nothing where none is held.
   */
  public static readonly getSlackIntegration = (organizationId: number | string) =>
    _readOptionalConnection(() =>
      apiRequest.get<ApiSlackIntegration>(IntegrationEndpoints.slack(organizationId))
    );

  /**
   * Records which channel to send to, which is also how a channel is changed.
   *
   * @param organizationId - Which organization is connecting.
   * @param channelId - The channel.
   */
  public static readonly setSlackChannel = (organizationId: number | string, channelId: string) =>
    apiRequest.post(IntegrationEndpoints.slack(organizationId), { channel_id: channelId });

  /**
   * Asks where to send the account for Slack's consent.
   *
   * @param organizationId - Which organization is connecting.
   * @returns The URL to leave for.
   */
  public static readonly getSlackRedirectUrl = async (organizationId: number | string) => {
    const { url } = await apiRequest.get<ApiIntegrationRedirect>(
      IntegrationEndpoints.slackRedirect(organizationId)
    );

    return url;
  };

  /**
   * Revokes an organization's Slack connection.
   *
   * @param organizationId - Whose connection to revoke.
   */
  public static readonly revokeSlackIntegration = (organizationId: number | string) =>
    apiRequest.delete(IntegrationEndpoints.slack(organizationId));

  /**
   * Reads the Splunk instance an organization sends to.
   *
   * @param organizationId - Whose connection to read.
   * @returns The connection, or nothing where none is held.
   */
  public static readonly getSplunkIntegration = (organizationId: number | string) =>
    _readOptionalConnection(() =>
      apiRequest.get<ApiSplunkIntegration>(IntegrationEndpoints.splunk(organizationId))
    );

  /**
   * Reads the indexes the connected Splunk instance holds.
   *
   * Splunk's own internal indexes begin with an underscore and are left out,
   * and the rest are reversed, as irene orders them.
   *
   * @param organizationId - Whose instance to ask.
   * @returns The indexes a configuration may write into.
   */
  public static readonly getSplunkIndexes = async (organizationId: number | string) => {
    const { indexes } = await apiRequest.get<{ indexes: string[] }>(
      IntegrationEndpoints.splunkIndexes(organizationId)
    );

    return indexes.filter((index) => !index.startsWith('_')).reverse();
  };

  /**
   * Records a Splunk connection, which is also how its indexes are changed.
   *
   * @param organizationId - Which organization is connecting.
   * @param details - The instance, its tokens, and what is written where.
   */
  public static readonly setSplunkIntegration = (
    organizationId: number | string,
    details: SplunkIntegrationRequest
  ) => apiRequest.post(IntegrationEndpoints.splunk(organizationId), details);

  /**
   * Revokes an organization's Splunk connection.
   *
   * @param organizationId - Whose connection to revoke.
   */
  public static readonly revokeSplunkIntegration = (organizationId: number | string) =>
    apiRequest.delete(IntegrationEndpoints.splunk(organizationId));
}
