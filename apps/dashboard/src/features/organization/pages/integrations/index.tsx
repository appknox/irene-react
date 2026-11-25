import { GithubIntegration } from './components/github-integration';
import { JiraIntegration } from './components/jira-integration';
import { ServiceNowIntegration } from './components/service-now-integration';
import { SlackIntegration } from './components/slack-integration';
import { SplunkIntegration } from './components/splunk-integration';

/**
 * The services an organization connects itself to.
 *
 * Each card reads its own connection, so one service failing to answer leaves
 * the rest of the row usable.
 */
export function OrganizationIntegrationsPage() {
  return (
    <div
      className="flex flex-wrap items-center bg-background p-3.5"
      data-test-organization-integrations
    >
      <GithubIntegration />

      <JiraIntegration />

      <ServiceNowIntegration />

      <SplunkIntegration />

      <SlackIntegration />
    </div>
  );
}
