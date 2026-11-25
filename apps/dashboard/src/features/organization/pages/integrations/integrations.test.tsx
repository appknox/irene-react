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

import { buildOrganization, buildOrganizationMe, buildSession } from '@tests/factories';
import { renderAtAddress } from '@tests/render';
import { server } from '@tests/server';

import { OrganizationIntegrationsPage } from './index';

const INTEGRATIONS_ADDRESS = '/dashboard/organization/settings/integrations';

/** Nothing connected anywhere, which is what each card's own test starts from. */
const withNothingConnected = () =>
  server.use(
    http.get(`*/${IntegrationEndpoints.github('*')}`, () => HttpResponse.json(null)),

    http.get(
      `*/${IntegrationEndpoints.jira('*')}`,
      () => new HttpResponse(null, { status: HTTP_STATUS_CODES.NOT_FOUND })
    ),

    http.get(`*/${IntegrationEndpoints.jiraSecurity('*')}`, () =>
      HttpResponse.json({
        status: 'not_connected',
        connected_on: null,
        configure_path: '/plugins/servlet/appknox',
        auto_push: false,
      })
    ),

    http.get(
      `*/${IntegrationEndpoints.serviceNow('*')}`,
      () => new HttpResponse(null, { status: HTTP_STATUS_CODES.NOT_FOUND })
    ),

    http.get(
      `*/${IntegrationEndpoints.slack('*')}`,
      () => new HttpResponse(null, { status: HTTP_STATUS_CODES.NOT_FOUND })
    ),

    http.get(
      `*/${IntegrationEndpoints.splunk('*')}`,
      () => new HttpResponse(null, { status: HTTP_STATUS_CODES.NOT_FOUND })
    )
  );

const renderTab = () =>
  renderAtAddress(
    <Fragment>
      <OrganizationIntegrationsPage />

      <AkToaster />
    </Fragment>,
    INTEGRATIONS_ADDRESS
  );

/** The card for one service, found by the title it carries. */
const cardFor = async (title: string) => {
  const heading = await screen.findByText(title);

  const card = heading.closest('[data-test-integration-card]');

  expect(card).not.toBeNull();

  return card as HTMLElement;
};

/** Opens one service's panel through whichever control its card offers. */
const openPanel = async (user: ReturnType<typeof userEvent.setup>, title: string) => {
  const card = await cardFor(title);

  await user.click(within(card).getByRole('button'));
};

beforeEach(() => {
  clearStoredSession();
  storeSession(buildSession());

  organizationStore
    .getState()
    .select(buildOrganization(), buildOrganizationMe({ is_owner: true, is_admin: true }));

  withNothingConnected();
});

describe('the integrations tab', () => {
  it('lists every service an organization can connect itself to', async () => {
    renderTab();

    expect(await screen.findByText(akMT('github'))).toBeInTheDocument();
    expect(await screen.findByText(akMT('jira'))).toBeInTheDocument();
    expect(await screen.findByText(akMT('serviceNow.title'))).toBeInTheDocument();
    expect(await screen.findByText(akMT('splunk.title'))).toBeInTheDocument();
    expect(await screen.findByText(akMT('slack.title'))).toBeInTheDocument();
  });
});

describe('Slack', () => {
  it('records the channel and then leaves for Slack to consent', async () => {
    const user = userEvent.setup();

    let sentChannel: string | null = null;
    let askedForConsent = false;

    server.use(
      http.post(`*/${IntegrationEndpoints.slack('*')}`, async ({ request }) => {
        sentChannel = ((await request.json()) as { channel_id: string }).channel_id;

        return HttpResponse.json({ channel_id: sentChannel, api_token: '' });
      }),

      http.get(`*/${IntegrationEndpoints.slackRedirect('*')}`, () => {
        askedForConsent = true;

        return HttpResponse.json({ url: 'https://slack.com/oauth/v2/authorize' });
      })
    );

    renderTab();

    await openPanel(user, akMT('slack.title'));
    await user.type(await screen.findByPlaceholderText(akMT('slack.enterChannelId')), 'C123');
    await user.click(screen.getByText(akMT('integrate')));

    await waitFor(() => expect(sentChannel).toBe('C123'));
    expect(askedForConsent).toBe(true);
  });

  it('changes the channel of a connected workspace without connecting again', async () => {
    const user = userEvent.setup();

    let sentChannel = 'C123';

    server.use(
      http.get(`*/${IntegrationEndpoints.slack('*')}`, () =>
        HttpResponse.json({ channel_id: sentChannel, api_token: 'tok' })
      ),

      http.post(`*/${IntegrationEndpoints.slack('*')}`, async ({ request }) => {
        sentChannel = ((await request.json()) as { channel_id: string }).channel_id;

        return HttpResponse.json({ channel_id: sentChannel, api_token: 'tok' });
      })
    );

    renderTab();

    await openPanel(user, akMT('slack.title'));

    expect(await screen.findByText('C123')).toBeInTheDocument();

    await user.click(screen.getByLabelText(akMT('edit')));

    const field = await screen.findByPlaceholderText(akMT('slack.enterChannelId'));

    await user.clear(field);
    await user.type(field, 'C999');
    await user.click(screen.getByText(akMT('save')));

    expect(await screen.findByText(akMT('slack.channelSaved'))).toBeInTheDocument();
    expect(sentChannel).toBe('C999');
  });
});

describe('ServiceNow', () => {
  it('sends the instance, the account and the table it raises items in', async () => {
    const user = userEvent.setup();

    let sent: Record<string, unknown> | null = null;

    server.use(
      http.post(`*/${IntegrationEndpoints.serviceNow('*')}`, async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json(sent);
      })
    );

    renderTab();

    await openPanel(user, akMT('serviceNow.title'));

    await user.type(
      await screen.findByPlaceholderText(akMT('serviceNow.enterInstanceURL')),
      'https://acme.service-now.com'
    );

    await user.type(screen.getByPlaceholderText(akMT('enterUsername')), 'ali');
    await user.type(screen.getByPlaceholderText(akMT('enterPassword')), 'secret');
    await user.click(screen.getByText(akMT('integrate')));

    await waitFor(() => expect(sent).not.toBeNull());

    expect(sent).toMatchObject({
      instance_url: 'https://acme.service-now.com',
      username: 'ali',
      table_name: 1,
    });

    expect(await screen.findByText(akMT('serviceNowIntegrated'))).toBeInTheDocument();
  });

  it('names the field the endpoint refused', async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`*/${IntegrationEndpoints.serviceNow('*')}`, () =>
        HttpResponse.json(
          { instance_url: ['Unreachable instance'] },
          { status: HTTP_STATUS_CODES.BAD_REQUEST }
        )
      )
    );

    renderTab();

    await openPanel(user, akMT('serviceNow.title'));

    await user.type(
      await screen.findByPlaceholderText(akMT('serviceNow.enterInstanceURL')),
      'https://acme.service-now.com'
    );

    await user.type(screen.getByPlaceholderText(akMT('enterUsername')), 'ali');
    await user.type(screen.getByPlaceholderText(akMT('enterPassword')), 'secret');
    await user.click(screen.getByText(akMT('integrate')));

    expect(await screen.findByText('instance_url - Unreachable instance')).toBeInTheDocument();
  });

  it('keeps a connected instance as a summary rather than a form', async () => {
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
      )
    );

    renderTab();

    await openPanel(user, akMT('serviceNow.title'));

    expect(await screen.findByText('https://acme.service-now.com')).toBeInTheDocument();
    expect(screen.getByText(akMT('disconnect'))).toBeInTheDocument();

    expect(
      screen.queryByPlaceholderText(akMT('serviceNow.enterInstanceURL'))
    ).not.toBeInTheDocument();
  });
});
