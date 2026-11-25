import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Fragment } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { IntegrationEndpoints } from '@irene/api/services/integration/endpoints';
import { organizationStore } from '@irene/api/stores/organization';
import { clearStoredSession, storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';
import { AkToaster } from '@irene/ui/ak-toaster';
import type { JiraSecurityStatus } from '@irene/api/services/integration';

import { buildOrganization, buildOrganizationMe, buildSession } from '@tests/factories';
import { renderAtAddress } from '@tests/render';
import { server } from '@tests/server';

import { JiraIntegration } from './components/jira-integration';
import { SplunkIntegration } from './components/splunk-integration';

const INTEGRATIONS_ADDRESS = '/dashboard/organization/settings/integrations';

/** Renders one card with the toaster beside it, as the tab around it has one. */
const renderCard = (card: 'jira' | 'splunk') =>
  renderAtAddress(
    <Fragment>
      {card === 'jira' ? <JiraIntegration /> : <SplunkIntegration />}

      <AkToaster />
    </Fragment>,
    INTEGRATIONS_ADDRESS
  );

const notFound = () => new HttpResponse(null, { status: HTTP_STATUS_CODES.NOT_FOUND });

/** Answers the Jira Security state, which the Jira card reads whatever is connected. */
const withJiraSecurity = (
  status: JiraSecurityStatus,
  configurePath: string | null = '/configure'
) =>
  server.use(
    http.get(`*/${IntegrationEndpoints.jiraSecurity('*')}`, () =>
      HttpResponse.json({
        status,
        connected_on: status === 'connected' ? '2026-01-01T00:00:00Z' : null,
        configure_path: configurePath,
        auto_push: false,
      })
    )
  );

const openPanel = async (user: ReturnType<typeof userEvent.setup>) => {
  const card = await waitFor(() => {
    const drawn = document.querySelector('[data-test-integration-card]');

    expect(drawn).not.toBeNull();

    return drawn as HTMLElement;
  });

  await user.click(within(card).getByRole('button'));
};

beforeEach(() => {
  clearStoredSession();
  storeSession(buildSession());

  organizationStore
    .getState()
    .select(buildOrganization(), buildOrganizationMe({ is_owner: true, is_admin: true }));
});

describe('Jira', () => {
  beforeEach(() => {
    server.use(http.get(`*/${IntegrationEndpoints.jira('*')}`, notFound));
    withJiraSecurity('not_connected');
  });

  it('offers the three ways to connect, cloud first', async () => {
    const user = userEvent.setup();

    renderCard('jira');

    await openPanel(user);

    expect(await screen.findByLabelText(akMT('jiraCloud'))).toBeChecked();
    expect(screen.getByLabelText(akMT('jiraDataCenter'))).not.toBeChecked();
    expect(screen.getByLabelText(akMT('jiraSecurity.title'))).not.toBeChecked();
  });

  it('asks for an access token on a data centre and an API key on cloud', async () => {
    const user = userEvent.setup();

    renderCard('jira');

    await openPanel(user);

    expect(await screen.findByText(akMT('apiKey'))).toBeInTheDocument();

    await user.click(screen.getByLabelText(akMT('jiraDataCenter')));

    expect(await screen.findByText(akMT('accessToken'))).toBeInTheDocument();
    expect(screen.queryByText(akMT('apiKey'))).not.toBeInTheDocument();
  });

  it('sends the host, the account and whether it is a data centre', async () => {
    const user = userEvent.setup();

    let sent: Record<string, unknown> | null = null;

    server.use(
      http.post(`*/${IntegrationEndpoints.jira('*')}`, async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json(sent);
      })
    );

    renderCard('jira');

    await openPanel(user);
    await user.click(await screen.findByLabelText(akMT('jiraDataCenter')));
    await user.type(screen.getByPlaceholderText(akMT('enterJiraHost')), 'https://jira.acme.test');
    await user.type(screen.getByPlaceholderText(akMT('enterUsername')), 'ali');
    await user.type(screen.getByPlaceholderText(akMT('enterAccessToken')), 'token');
    await user.click(screen.getByText(akMT('integrate')));

    await waitFor(() => expect(sent).not.toBeNull());

    expect(sent).toStrictEqual({
      host: 'https://jira.acme.test',
      username: 'ali',
      password: 'token',
      is_data_center: true,
    });
  });

  it('reads the credentials the endpoint refused as invalid ones', async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`*/${IntegrationEndpoints.jira('*')}`, () =>
        HttpResponse.json({ username: ['wrong'] }, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    renderCard('jira');

    await openPanel(user);

    await user.type(
      await screen.findByPlaceholderText(akMT('enterJiraHost')),
      'https://acme.atlassian.net'
    );

    await user.type(screen.getByPlaceholderText(akMT('enterUsername')), 'ali');
    await user.type(screen.getByPlaceholderText(akMT('enterApiKey')), 'key');
    await user.click(screen.getByText(akMT('integrate')));

    expect(await screen.findByText(akMT('tInValidCredentials'))).toBeInTheDocument();
  });

  it('closes off Security while an account is connected, and says why', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`*/${IntegrationEndpoints.jira('*')}`, () =>
        HttpResponse.json({ host: 'https://acme.atlassian.net', username: 'ali' })
      )
    );

    renderCard('jira');

    await openPanel(user);

    expect(await screen.findByLabelText(akMT('jiraSecurity.title'))).toBeDisabled();
    expect(screen.getByText(akMT('jiraOneIntegrationAtATime'))).toBeInTheDocument();
    expect(screen.getByText('ali')).toBeInTheDocument();
  });

  it('closes off the account types once Security is set up', async () => {
    const user = userEvent.setup();

    withJiraSecurity('awaiting_jira');

    renderCard('jira');

    await openPanel(user);

    expect(await screen.findByLabelText(akMT('jiraCloud'))).toBeDisabled();
    expect(screen.getByLabelText(akMT('jiraDataCenter'))).toBeDisabled();
  });

  it('walks an administrator through Security, refusing a site that is not a Jira one', async () => {
    const user = userEvent.setup();

    let minted = false;

    server.use(
      http.post(`*/${IntegrationEndpoints.jiraSecurity('*')}`, () => {
        minted = true;

        return HttpResponse.json({ secret: 'sh-ar-ed' });
      })
    );

    renderCard('jira');

    await openPanel(user);
    await user.click(await screen.findByLabelText(akMT('jiraSecurity.title')));

    const site = await screen.findByLabelText(akMT('jiraSecurity.siteLabel'));

    await user.type(site, 'acme.example.test');

    expect(await screen.findByText(akMT('jiraSecurity.invalidSite'))).toBeInTheDocument();
    expect(screen.getByText(akMT('jiraSecurity.generateSecret'))).toBeDisabled();

    await user.clear(site);
    await user.type(site, 'acme.atlassian.net');
    await user.click(screen.getByText(akMT('jiraSecurity.generateSecret')));

    await waitFor(() => expect(minted).toBe(true));

    expect(await screen.findByDisplayValue('sh-ar-ed')).toBeInTheDocument();
    expect(screen.getByText(akMT('jiraSecurity.continueToJira'))).toBeInTheDocument();
  });

  it('offers the push setting only once Jira has completed the connection', async () => {
    const user = userEvent.setup();

    withJiraSecurity('connected');

    renderCard('jira');

    await openPanel(user);
    await user.click(await screen.findByLabelText(akMT('jiraSecurity.title')));

    expect(await screen.findByText(akMT('jiraSecurity.autoPush'))).toBeInTheDocument();
    expect(screen.getByText(akMT('jiraSecurity.connected'))).toBeInTheDocument();

    expect(screen.queryByText(akMT('jiraSecurity.generateSecret'))).not.toBeInTheDocument();
  });

  it('gives the steps in words where the deployment has no configure path', async () => {
    const user = userEvent.setup();

    withJiraSecurity('not_connected', null);

    renderCard('jira');

    await openPanel(user);
    await user.click(await screen.findByLabelText(akMT('jiraSecurity.title')));

    expect(await screen.findByText(akMT('jiraSecurity.manualSteps'))).toBeInTheDocument();
  });
});

describe('Splunk', () => {
  beforeEach(() => {
    server.use(
      http.get(`*/${IntegrationEndpoints.splunk('*')}`, notFound),

      http.get(`*/${IntegrationEndpoints.splunkIndexes('*')}`, () =>
        HttpResponse.json({ indexes: ['_internal', 'logs', 'findings'] })
      )
    );
  });

  it('holds the second step back until the instance answers with its indexes', async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`*/${IntegrationEndpoints.splunk('*')}`, () => HttpResponse.json({})),

      http.get(`*/${IntegrationEndpoints.splunkIndexes('*')}`, () =>
        HttpResponse.json({ indexes: [] })
      )
    );

    renderCard('splunk');

    await openPanel(user);

    expect(await screen.findByText(akMT('configureStep1'))).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText(akMT('splunk.enterInstanceURL')),
      'https://splunk.acme.test/'
    );

    await user.type(screen.getByPlaceholderText(akMT('splunk.enterHecToken')), 'hec');
    await user.type(screen.getByPlaceholderText(akMT('splunk.enterApiToken')), 'api');
    await user.click(screen.getByText(akMT('saveAndProceed')));

    expect(await screen.findByText(akMT('splunk.errorFetchingIndexes'))).toBeInTheDocument();
    expect(screen.queryByText(akMT('configureStep2'))).not.toBeInTheDocument();
  });

  it('carries the credentials into the second step and trims the instance', async () => {
    const user = userEvent.setup();

    const sent: Record<string, unknown>[] = [];

    server.use(
      http.post(`*/${IntegrationEndpoints.splunk('*')}`, async ({ request }) => {
        sent.push((await request.json()) as Record<string, unknown>);

        return HttpResponse.json({});
      })
    );

    renderCard('splunk');

    await openPanel(user);

    await user.type(
      await screen.findByPlaceholderText(akMT('splunk.enterInstanceURL')),
      'https://splunk.acme.test/'
    );

    await user.type(screen.getByPlaceholderText(akMT('splunk.enterHecToken')), 'hec');
    await user.type(screen.getByPlaceholderText(akMT('splunk.enterApiToken')), 'api');
    await user.click(screen.getByText(akMT('saveAndProceed')));

    expect(await screen.findByText(akMT('configureStep2'))).toBeInTheDocument();

    /* Splunk's own internal indexes are left out, and the rest arrive reversed. */
    await waitFor(() =>
      expect(document.querySelector('[data-test-splunk-vuln-index]')).toHaveTextContent('findings')
    );

    await user.click(screen.getByText(akMT('integrate')));

    expect(await screen.findByText(akMT('splunkIntegrated'))).toBeInTheDocument();

    expect(sent[0]).toMatchObject({
      instance_url: 'https://splunk.acme.test',
      hec_token: 'hec',
      api_token: 'api',
    });

    expect(sent.at(-1)).toMatchObject({ vulnerability_index: 'findings', send_user_logs: false });
  });

  it('saves the user-log switch of a connected instance as it is moved', async () => {
    const user = userEvent.setup();

    let sent: Record<string, unknown> | null = null;

    const connection = {
      id: 1,
      instance_url: 'https://splunk.acme.test',
      hec_token: 'hec',
      api_token: 'api',
      vulnerability_index: 'findings',
      send_user_logs: false,
      user_logs_index: 'logs',
      log_frequency_hours: 24,
      created_on: '2026-01-01T00:00:00Z',
      updated_on: '2026-01-01T00:00:00Z',
    };

    server.use(
      http.get(`*/${IntegrationEndpoints.splunk('*')}`, () => HttpResponse.json(connection)),

      http.post(`*/${IntegrationEndpoints.splunk('*')}`, async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json(sent);
      })
    );

    renderCard('splunk');

    await openPanel(user);

    await waitFor(() =>
      expect(document.querySelector('[data-test-integrated-account-property]')).toHaveTextContent(
        'findings'
      )
    );

    await user.click(screen.getByLabelText(akMT('splunk.sendUserLogs')));

    await waitFor(() => expect(sent).not.toBeNull());

    expect(sent).toMatchObject({
      send_user_logs: true,
      user_logs_index: 'logs',
      log_frequency_hours: 24,
      instance_url: 'https://splunk.acme.test',
    });
  });
});
