import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Fragment, type ReactNode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

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

const noContent = () => new HttpResponse(null, { status: HTTP_STATUS_CODES.NO_CONTENT });

const SPLUNK_CONNECTION = {
  id: 1,
  instance_url: 'https://splunk.acme.test',
  hec_token: 'hec',
  api_token: 'api',
  vulnerability_index: 'findings',
  send_user_logs: true,
  user_logs_index: 'logs',
  log_frequency_hours: 24,
  created_on: '2026-01-01T00:00:00Z',
  updated_on: '2026-01-01T00:00:00Z',
};

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

beforeEach(() => {
  clearStoredSession();
  storeSession(buildSession());

  organizationStore
    .getState()
    .select(buildOrganization(), buildOrganizationMe({ is_owner: true, is_admin: true }));

  /* Jira reads this whatever is connected, so every card below needs it answered. */
  server.use(
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

describe('revoking a connection', () => {
  it('asks before revoking Jira, and keeps it when the question is cancelled', async () => {
    const user = userEvent.setup();

    let revoked = false;

    server.use(
      http.get(`*/${IntegrationEndpoints.jira('*')}`, () =>
        revoked
          ? new HttpResponse(null, { status: HTTP_STATUS_CODES.NOT_FOUND })
          : HttpResponse.json({ host: 'https://acme.atlassian.net', username: 'ali' })
      ),

      http.delete(`*/${IntegrationEndpoints.jira('*')}`, () => {
        revoked = true;

        return noContent();
      })
    );

    renderCard(<JiraIntegration />);

    await openPanel(user);
    await user.click(await screen.findByText(akMT('disconnect')));

    expect(await screen.findByText(akMT('confirmBox.revokeJira'))).toBeInTheDocument();

    await user.click(screen.getByText(akMT('cancel')));

    expect(await screen.findByText('ali')).toBeInTheDocument();
    expect(revoked).toBe(false);

    await user.click(screen.getByText(akMT('disconnect')));
    await user.click(await screen.findByText(akMT('yesDisconnect')));

    expect(await screen.findByText(akMT('jiraWillBeRevoked'))).toBeInTheDocument();
  });

  it('revokes ServiceNow and says the authorization is going', async () => {
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

      http.delete(`*/${IntegrationEndpoints.serviceNow('*')}`, noContent)
    );

    renderCard(<ServiceNowIntegration />);

    await openPanel(user);
    await user.click(await screen.findByText(akMT('disconnect')));
    await user.click(await screen.findByText(akMT('yesDisconnect')));

    expect(await screen.findByText(akMT('serviceNow.willBeRevoked'))).toBeInTheDocument();
  });

  it('revokes Slack and says the authorization is going', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`*/${IntegrationEndpoints.slack('*')}`, () =>
        HttpResponse.json({ channel_id: 'C123', api_token: 'tok' })
      ),

      http.delete(`*/${IntegrationEndpoints.slack('*')}`, noContent)
    );

    renderCard(<SlackIntegration />);

    await openPanel(user);
    await user.click(await screen.findByText(akMT('disconnect')));
    await user.click(await screen.findByText(akMT('yesDisconnect')));

    expect(await screen.findByText(akMT('slack.willBeRevoked'))).toBeInTheDocument();
  });

  it('says what went wrong where Splunk refuses to be revoked', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`*/${IntegrationEndpoints.splunk('*')}`, () => HttpResponse.json(SPLUNK_CONNECTION)),

      http.get(`*/${IntegrationEndpoints.splunkIndexes('*')}`, () =>
        HttpResponse.json({ indexes: ['logs', 'findings'] })
      ),

      http.delete(
        `*/${IntegrationEndpoints.splunk('*')}`,
        () => new HttpResponse(null, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    renderCard(<SplunkIntegration />);

    await openPanel(user);
    await user.click(await screen.findByText(akMT('disconnect')));
    await user.click(await screen.findByText(akMT('yesDisconnect')));

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
  });
});

describe("Splunk's user logs, on a connected instance", () => {
  beforeEach(() => {
    server.use(
      http.get(`*/${IntegrationEndpoints.splunk('*')}`, () => HttpResponse.json(SPLUNK_CONNECTION)),

      http.get(`*/${IntegrationEndpoints.splunkIndexes('*')}`, () =>
        HttpResponse.json({ indexes: ['logs', 'findings'] })
      )
    );
  });

  it('reads the index and interval until the edit control is pressed', async () => {
    const user = userEvent.setup();

    renderCard(<SplunkIntegration />);

    await openPanel(user);

    expect(await screen.findByText('logs')).toBeInTheDocument();
    expect(screen.getByText(`24 ${akMT('hours')}`)).toBeInTheDocument();
    expect(screen.queryByLabelText(akMT('splunk.userLogsIndex'))).not.toBeInTheDocument();

    await user.click(screen.getByLabelText(akMT('edit')));

    expect(await screen.findByLabelText(akMT('splunk.userLogsIndex'))).toBeInTheDocument();
    expect(screen.getByLabelText(akMT('splunk.timeInterval'))).toBeInTheDocument();
  });

  it('saves the changed choices on their own control', async () => {
    const user = userEvent.setup();

    let sent: Record<string, unknown> | null = null;

    server.use(
      http.post(`*/${IntegrationEndpoints.splunk('*')}`, async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json(sent);
      })
    );

    renderCard(<SplunkIntegration />);

    await openPanel(user);
    await user.click(await screen.findByLabelText(akMT('edit')));
    await user.click(screen.getByText(akMT('save')));

    await waitFor(() => expect(sent).not.toBeNull());

    expect(sent).toMatchObject({
      send_user_logs: true,
      user_logs_index: 'logs',
      log_frequency_hours: 24,
    });
  });
});

describe('Jira Security, once Jira has completed the connection', () => {
  beforeEach(() => {
    server.use(
      http.get(
        `*/${IntegrationEndpoints.jira('*')}`,
        () => new HttpResponse(null, { status: 404 })
      ),

      http.get(`*/${IntegrationEndpoints.jiraSecurity('*')}`, () =>
        HttpResponse.json({
          status: 'connected',
          connected_on: '2026-01-01T09:30:00Z',
          configure_path: '/configure',
          auto_push: false,
        })
      )
    );
  });

  const openSecurity = async (user: ReturnType<typeof userEvent.setup>) => {
    renderCard(<JiraIntegration />);

    await openPanel(user);
    await user.click(await screen.findByLabelText(akMT('jiraSecurity.title')));
  };

  it('sets whether findings are pushed as they change', async () => {
    const user = userEvent.setup();

    let sent: unknown = null;

    server.use(
      http.patch(`*/${IntegrationEndpoints.jiraSecurity('*')}`, async ({ request }) => {
        sent = await request.json();

        return HttpResponse.json({ auto_push: true });
      })
    );

    await openSecurity(user);
    await user.click(await screen.findByLabelText(akMT('jiraSecurity.autoPush')));

    await waitFor(() => expect(sent).toStrictEqual({ auto_push: true }));
  });

  it('asks before taking the connection down', async () => {
    const user = userEvent.setup();

    let disconnected = false;

    server.use(
      http.delete(`*/${IntegrationEndpoints.jiraSecurity('*')}`, () => {
        disconnected = true;

        return noContent();
      })
    );

    await openSecurity(user);
    await user.click(await screen.findByText(akMT('disconnect')));

    expect(await screen.findByText(akMT('jiraSecurity.disconnectWarning'))).toBeInTheDocument();

    await user.click(screen.getByText(akMT('yesDisconnect')));

    await waitFor(() => expect(disconnected).toBe(true));
  });

  it('warns before minting a secret that replaces the one Jira holds', async () => {
    const user = userEvent.setup();

    let minted = false;

    server.use(
      http.post(`*/${IntegrationEndpoints.jiraSecurity('*')}`, () => {
        minted = true;

        return HttpResponse.json({ secret: 'new-one' });
      })
    );

    await openSecurity(user);
    await user.click(await screen.findByText(akMT('jiraSecurity.regenerate')));

    expect(await screen.findByText(akMT('jiraSecurity.regenerateWarning'))).toBeInTheDocument();

    await user.click(screen.getByText(akMT('yesDisconnect')));

    await waitFor(() => expect(minted).toBe(true));
  });
});
