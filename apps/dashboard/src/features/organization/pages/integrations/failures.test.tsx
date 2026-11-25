import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Fragment, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IntegrationEndpoints } from '@irene/api/services/integration/endpoints';
import { organizationStore } from '@irene/api/stores/organization';
import { clearStoredSession, storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';
import { AkToaster } from '@irene/ui/ak-toaster';

import { buildOrganization, buildOrganizationMe, buildSession } from '@tests/factories';
import { renderAtAddress } from '@tests/render';
import { server } from '@tests/server';

import { JiraIntegration } from './components/jira-integration';
import { ServiceNowIntegration } from './components/service-now-integration';
import { SlackIntegration } from './components/slack-integration';
import { SplunkIntegration } from './components/splunk-integration';

const INTEGRATIONS_ADDRESS = '/dashboard/organization/settings/integrations';

const notFound = () => new HttpResponse(null, { status: HTTP_STATUS_CODES.NOT_FOUND });
const refused = () => new HttpResponse(null, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR });

const renderCard = (card: ReactNode) =>
  renderAtAddress(
    <Fragment>
      {card}

      <AkToaster />
    </Fragment>,
    INTEGRATIONS_ADDRESS
  );

const openPanel = async (user: ReturnType<typeof userEvent.setup>) => {
  const card = await waitFor(() => {
    const drawn = document.querySelector('[data-test-integration-card]');

    expect(drawn).not.toBeNull();

    return drawn as HTMLElement;
  });

  await user.click(within(card).getByRole('button'));
};

/** Fills the Jira form and submits it, which each refusal below answers differently. */
const submitJira = async (user: ReturnType<typeof userEvent.setup>) => {
  renderCard(<JiraIntegration />);

  await openPanel(user);

  await user.type(
    await screen.findByPlaceholderText(akMT('enterJiraHost')),
    'https://acme.atlassian.net'
  );

  await user.type(screen.getByPlaceholderText(akMT('enterUsername')), 'ali');
  await user.type(screen.getByPlaceholderText(akMT('enterApiKey')), 'key');
  await user.click(screen.getByText(akMT('integrate')));
};

beforeEach(() => {
  clearStoredSession();
  storeSession(buildSession());

  organizationStore
    .getState()
    .select(buildOrganization(), buildOrganizationMe({ is_owner: true, is_admin: true }));

  server.use(
    http.get(`*/${IntegrationEndpoints.jira('*')}`, notFound),

    http.get(`*/${IntegrationEndpoints.jiraSecurity('*')}`, () =>
      HttpResponse.json({
        status: 'not_connected',
        connected_on: null,
        configure_path: '/configure',
        auto_push: false,
      })
    )
  );
});

describe('Jira, reading what a refusal says', () => {
  it('quotes the complaint about the host', async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`*/${IntegrationEndpoints.jira('*')}`, () =>
        HttpResponse.json({ host: ['Not a Jira host'] }, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    await submitJira(user);

    expect(await screen.findByText('Not a Jira host')).toBeInTheDocument();
  });

  it('quotes a complaint the endpoint puts under detail', async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`*/${IntegrationEndpoints.jira('*')}`, () =>
        HttpResponse.json(
          { detail: 'Already connected' },
          { status: HTTP_STATUS_CODES.BAD_REQUEST }
        )
      )
    );

    await submitJira(user);

    expect(await screen.findByText('Already connected')).toBeInTheDocument();
  });

  it('asks for another try where the refusal says nothing useful', async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`*/${IntegrationEndpoints.jira('*')}`, () =>
        HttpResponse.json({ other: ['unreadable'] }, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    await submitJira(user);

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
  });

  it('asks for another try where the refusal carries no body at all', async () => {
    const user = userEvent.setup();

    server.use(http.post(`*/${IntegrationEndpoints.jira('*')}`, refused));

    await submitJira(user);

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
  });

  it('asks for another try where revoking is refused', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`*/${IntegrationEndpoints.jira('*')}`, () =>
        HttpResponse.json({ host: 'https://acme.atlassian.net', username: 'ali' })
      ),

      http.delete(`*/${IntegrationEndpoints.jira('*')}`, refused)
    );

    renderCard(<JiraIntegration />);

    await openPanel(user);
    await user.click(await screen.findByText(akMT('disconnect')));
    await user.click(await screen.findByText(akMT('yesDisconnect')));

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
  });
});

describe('Slack, when the API refuses', () => {
  it('asks for another try where the consent screen cannot be asked for', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`*/${IntegrationEndpoints.slack('*')}`, notFound),
      http.post(`*/${IntegrationEndpoints.slack('*')}`, () =>
        HttpResponse.json({ channel_id: 'C123', api_token: '' })
      ),

      http.get(`*/${IntegrationEndpoints.slackRedirect('*')}`, refused)
    );

    renderCard(<SlackIntegration />);

    await openPanel(user);
    await user.type(await screen.findByPlaceholderText(akMT('slack.enterChannelId')), 'C123');
    await user.click(screen.getByText(akMT('integrate')));

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
  });

  it('puts the connection back on screen where saving a changed channel fails', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`*/${IntegrationEndpoints.slack('*')}`, () =>
        HttpResponse.json({ channel_id: 'C123', api_token: 'tok' })
      ),

      http.post(`*/${IntegrationEndpoints.slack('*')}`, refused)
    );

    renderCard(<SlackIntegration />);

    await openPanel(user);
    await user.click(await screen.findByLabelText(akMT('edit')));

    const field = await screen.findByPlaceholderText(akMT('slack.enterChannelId'));

    await user.clear(field);
    await user.type(field, 'C999');
    await user.click(screen.getByText(akMT('save')));

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
    expect(await screen.findByText('C123')).toBeInTheDocument();
  });

  it('asks for another try where revoking is refused', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`*/${IntegrationEndpoints.slack('*')}`, () =>
        HttpResponse.json({ channel_id: 'C123', api_token: 'tok' })
      ),

      http.delete(`*/${IntegrationEndpoints.slack('*')}`, refused)
    );

    renderCard(<SlackIntegration />);

    await openPanel(user);
    await user.click(await screen.findByText(akMT('disconnect')));
    await user.click(await screen.findByText(akMT('yesDisconnect')));

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
  });
});

describe('ServiceNow, when the API refuses', () => {
  it('asks for another try where the refusal names no field', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`*/${IntegrationEndpoints.serviceNow('*')}`, notFound),
      http.post(`*/${IntegrationEndpoints.serviceNow('*')}`, refused)
    );

    renderCard(<ServiceNowIntegration />);

    await openPanel(user);

    await user.type(
      await screen.findByPlaceholderText(akMT('serviceNow.enterInstanceURL')),
      'https://acme.service-now.com'
    );

    await user.type(screen.getByPlaceholderText(akMT('enterUsername')), 'ali');
    await user.type(screen.getByPlaceholderText(akMT('enterPassword')), 'secret');
    await user.click(screen.getByText(akMT('integrate')));

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
  });

  it('asks for another try where revoking is refused', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`*/${IntegrationEndpoints.serviceNow('*')}`, () =>
        HttpResponse.json({
          id: 1,
          instance_url: 'https://acme.service-now.com',
          username: 'ali',
          table_name: '1',
          created_on: '2026-01-01T00:00:00Z',
          updated_on: '2026-01-01T00:00:00Z',
        })
      ),

      http.delete(`*/${IntegrationEndpoints.serviceNow('*')}`, refused)
    );

    renderCard(<ServiceNowIntegration />);

    await openPanel(user);
    await user.click(await screen.findByText(akMT('disconnect')));
    await user.click(await screen.findByText(akMT('yesDisconnect')));

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
  });

  it('refuses a form whose instance is not a URL before sending anything', async () => {
    const user = userEvent.setup();

    let sent = false;

    server.use(
      http.get(`*/${IntegrationEndpoints.serviceNow('*')}`, notFound),

      http.post(`*/${IntegrationEndpoints.serviceNow('*')}`, () => {
        sent = true;

        return HttpResponse.json({});
      })
    );

    renderCard(<ServiceNowIntegration />);

    await openPanel(user);

    await user.type(
      await screen.findByPlaceholderText(akMT('serviceNow.enterInstanceURL')),
      'acme.service-now.com'
    );

    await user.type(screen.getByPlaceholderText(akMT('enterUsername')), 'ali');
    await user.type(screen.getByPlaceholderText(akMT('enterPassword')), 'secret');
    await user.click(screen.getByText(akMT('integrate')));

    expect(await screen.findByText(akMT('enterValidURL'))).toBeInTheDocument();
    expect(sent).toBe(false);
  });
});

describe('Splunk, when the API refuses', () => {
  it('names the field the first step was refused on', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`*/${IntegrationEndpoints.splunk('*')}`, notFound),

      http.post(`*/${IntegrationEndpoints.splunk('*')}`, () =>
        HttpResponse.json(
          { hec_token: ['Rejected by the instance'] },
          { status: HTTP_STATUS_CODES.BAD_REQUEST }
        )
      )
    );

    renderCard(<SplunkIntegration />);

    await openPanel(user);

    await user.type(
      await screen.findByPlaceholderText(akMT('splunk.enterInstanceURL')),
      'https://splunk.acme.test'
    );

    await user.type(screen.getByPlaceholderText(akMT('splunk.enterHecToken')), 'hec');
    await user.type(screen.getByPlaceholderText(akMT('splunk.enterApiToken')), 'api');
    await user.click(screen.getByText(akMT('saveAndProceed')));

    expect(await screen.findByText('hec_token - Rejected by the instance')).toBeInTheDocument();
  });

  it('asks for another try where the refusal names no field', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`*/${IntegrationEndpoints.splunk('*')}`, notFound),
      http.post(`*/${IntegrationEndpoints.splunk('*')}`, refused)
    );

    renderCard(<SplunkIntegration />);

    await openPanel(user);

    await user.type(
      await screen.findByPlaceholderText(akMT('splunk.enterInstanceURL')),
      'https://splunk.acme.test'
    );

    await user.type(screen.getByPlaceholderText(akMT('splunk.enterHecToken')), 'hec');
    await user.type(screen.getByPlaceholderText(akMT('splunk.enterApiToken')), 'api');
    await user.click(screen.getByText(akMT('saveAndProceed')));

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
  });
});

describe('Jira Security, when the API refuses', () => {
  const connected = () =>
    server.use(
      http.get(`*/${IntegrationEndpoints.jiraSecurity('*')}`, () =>
        HttpResponse.json({
          status: 'connected',
          connected_on: null,
          configure_path: null,
          auto_push: false,
        })
      )
    );

  const openSecurity = async (user: ReturnType<typeof userEvent.setup>) => {
    renderCard(<JiraIntegration />);

    await openPanel(user);
    await user.click(await screen.findByLabelText(akMT('jiraSecurity.title')));
  };

  it('puts the push setting back where the API refuses it', async () => {
    const user = userEvent.setup();

    connected();

    server.use(http.patch(`*/${IntegrationEndpoints.jiraSecurity('*')}`, refused));

    await openSecurity(user);
    await user.click(await screen.findByLabelText(akMT('jiraSecurity.autoPush')));

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
  });

  it('asks for another try where taking the connection down is refused', async () => {
    const user = userEvent.setup();

    connected();

    server.use(http.delete(`*/${IntegrationEndpoints.jiraSecurity('*')}`, refused));

    await openSecurity(user);
    await user.click(await screen.findByText(akMT('disconnect')));
    await user.click(await screen.findByText(akMT('yesDisconnect')));

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
  });

  it('asks for another try where the secret cannot be minted', async () => {
    const user = userEvent.setup();

    server.use(http.post(`*/${IntegrationEndpoints.jiraSecurity('*')}`, refused));

    await openSecurity(user);

    await user.type(
      await screen.findByLabelText(akMT('jiraSecurity.siteLabel')),
      'https://acme.atlassian.net/jira'
    );

    await user.click(screen.getByText(akMT('jiraSecurity.generateSecret')));

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
  });

  it('marks the copy control copied once, and again after a second copy', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn<() => Promise<void>>().mockResolvedValue();

    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });

    server.use(
      http.post(`*/${IntegrationEndpoints.jiraSecurity('*')}`, () =>
        HttpResponse.json({ secret: 'sh-ar-ed' })
      )
    );

    await openSecurity(user);

    await user.type(
      await screen.findByLabelText(akMT('jiraSecurity.siteLabel')),
      'acme.atlassian.net'
    );

    await user.click(screen.getByText(akMT('jiraSecurity.generateSecret')));
    await screen.findByDisplayValue('sh-ar-ed');

    await user.click(screen.getByLabelText(akMT('jiraSecurity.copy')));
    await user.click(screen.getByLabelText(akMT('jiraSecurity.copy')));

    expect(writeText).toHaveBeenCalledTimes(2);
  });
});
