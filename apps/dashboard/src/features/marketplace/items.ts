import { akMT } from '@irene/translations/intl';
import appCenterLogo from '@irene/ui/images/app-center-icon.png';
import armorcodeLogo from '@irene/ui/images/armorcode-icon.png';
import azureLogo from '@irene/ui/images/azure-icon.png';
import bitbucketLogo from '@irene/ui/images/bitbucket-icon.png';
import bitriseLogo from '@irene/ui/images/bitrise-icon.png';
import circleciLogo from '@irene/ui/images/circleci-icon.png';
import codemagicLogo from '@irene/ui/images/codemagic-icon.png';
import githubLogo from '@irene/ui/images/github-icon.png';
import gitlabLogo from '@irene/ui/images/gitlab-icon.png';
import jenkinsLogo from '@irene/ui/images/jenkins-icon.png';
import jiraLogo from '@irene/ui/images/jira-icon.png';
import octocatLogo from '@irene/ui/images/octocat.png';
import serviceNowLogo from '@irene/ui/images/service-now.png';
import slackLogo from '@irene/ui/images/slack-icon.png';
import splunkLogo from '@irene/ui/images/splunk-icon.png';

import type { SetupGuideId } from '@/features/marketplace/components/setup-guides';

interface MarketplaceItemBase {
  id: string;
  title: string;
  description: string;
  logo: string;
}

/**
 * One tool on the marketplace, by what opening it does: a page the tool's
 * maker publishes, the steps to wire it in by hand, or the organization's
 * integration settings, where the five notification tools are connected.
 */
export type MarketplaceItem = MarketplaceItemBase &
  (
    | { kind: 'link'; href: string }
    | { kind: 'guide'; guide: SetupGuideId; heading: string }
    | { kind: 'integration' }
  );

/**
 * The CI/CD plugins, in irene's order. A plugin its maker publishes opens that
 * page; the rest open their setup steps.
 *
 * @returns One item per plugin.
 */
export const getMarketplacePlugins = (): MarketplaceItem[] => {
  const viewInstructions = akMT('viewIntegrationInstructions');
  const heading = akMT('integrateAppknoxToCICDPipeline');

  return [
    {
      id: 'azure',
      kind: 'link',
      title: akMT('azurePipeline'),
      description: akMT('installAppknoxPluginTo') + akMT('azurePipeline'),
      logo: azureLogo,
      href: 'https://marketplace.visualstudio.com/items?itemName=appknox.appknox',
    },
    {
      id: 'jenkins',
      kind: 'link',
      title: akMT('jenkinsPipeline'),
      description: viewInstructions,
      logo: jenkinsLogo,
      href: 'https://plugins.jenkins.io/appknox-scanner/',
    },
    {
      id: 'circleci',
      kind: 'guide',
      title: akMT('circleCIPipeline'),
      description: viewInstructions,
      logo: circleciLogo,
      guide: 'cli',
      heading,
    },
    {
      id: 'bitbucket',
      kind: 'guide',
      title: akMT('bitbucketPipeline'),
      description: viewInstructions,
      logo: bitbucketLogo,
      guide: 'cli',
      heading,
    },
    {
      id: 'app-center',
      kind: 'guide',
      title: akMT('appCenterPipeline'),
      description: viewInstructions,
      logo: appCenterLogo,
      guide: 'app-center',
      heading,
    },
    {
      id: 'bitrise',
      kind: 'guide',
      title: akMT('bitriseWorkflow'),
      description: viewInstructions,
      logo: bitriseLogo,
      guide: 'bitrise',
      heading,
    },
    {
      id: 'github-action',
      kind: 'link',
      title: akMT('githubAction'),
      description: viewInstructions,
      logo: octocatLogo,
      href: 'https://github.com/marketplace/actions/appknox-github-action',
    },
    {
      id: 'gitlab',
      kind: 'guide',
      title: akMT('gitlab'),
      description: viewInstructions,
      logo: gitlabLogo,
      guide: 'cli',
      heading,
    },
    {
      id: 'codemagic',
      kind: 'link',
      title: akMT('codemagic'),
      description: viewInstructions,
      logo: codemagicLogo,
      href: 'https://docs.codemagic.io/integrations/appknox-integration/',
    },
  ];
};

/**
 * The integrations, in irene's order: five connected from the organization's
 * settings, and ArmorCode, which is set up from its own side.
 *
 * @returns One item per integration.
 */
export const getMarketplaceIntegrations = (): MarketplaceItem[] => {
  const integrateTo = akMT('integrateAppknoxTo');

  const connected = [
    { id: 'github', title: akMT('github'), logo: githubLogo },
    { id: 'jira', title: akMT('jira'), logo: jiraLogo },
    { id: 'service-now', title: akMT('serviceNow.title'), logo: serviceNowLogo },
    { id: 'splunk', title: akMT('splunk.title'), logo: splunkLogo },
    { id: 'slack', title: akMT('slack.title'), logo: slackLogo },
  ].map((tool): MarketplaceItem => ({
    ...tool,
    kind: 'integration',
    description: integrateTo + tool.title,
  }));

  return [
    ...connected,
    {
      id: 'armorcode',
      kind: 'guide',
      title: akMT('armorcode'),
      description: akMT('viewIntegrationInstructions'),
      logo: armorcodeLogo,
      guide: 'armorcode',
      heading: akMT('integrationSteps'),
    },
  ];
};
