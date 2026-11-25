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
import { SplunkIntegration } from './components/splunk-integration';

const INTEGRATIONS_ADDRESS = '/dashboard/organization/settings/integrations';

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

  server.use(
    http.get(
      `*/${IntegrationEndpoints.jira('*')}`,
      () => new HttpResponse(null, { status: HTTP_STATUS_CODES.NOT_FOUND })
    ),

    http.get(`*/${IntegrationEndpoints.jiraSecurity('*')}`, () =>
      HttpResponse.json({
        status: 'not_connected',
        connected_on: null,
        configure_path: '/configure',
        auto_push: false,
      })
    ),

    http.post(`*/${IntegrationEndpoints.jiraSecurity('*')}`, () =>
      HttpResponse.json({ secret: 'sh-ar-ed' })
    )
  );
});

/** Puts a clipboard on the window, which jsdom does not provide. */
const withClipboard = (writeText: () => Promise<void>) => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
};

/** Walks Jira Security as far as a minted secret, which is where copying begins. */
const mintSecret = async (user: ReturnType<typeof userEvent.setup>) => {
  renderCard(<JiraIntegration />);

  await openPanel(user);
  await user.click(await screen.findByLabelText(akMT('jiraSecurity.title')));

  await user.type(
    await screen.findByLabelText(akMT('jiraSecurity.siteLabel')),
    'acme.atlassian.net'
  );

  await user.click(screen.getByText(akMT('jiraSecurity.generateSecret')));
  await screen.findByDisplayValue('sh-ar-ed');
};

describe('copying the Jira Security secret', () => {
  it('says it is copied, and marks the control for a moment', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn<() => Promise<void>>().mockResolvedValue();

    withClipboard(writeText);

    await mintSecret(user);
    await user.click(screen.getByLabelText(akMT('jiraSecurity.copy')));

    expect(await screen.findByText(akMT('jiraSecurity.copied'))).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith('sh-ar-ed');
  });

  it('says so where the browser refuses the clipboard', async () => {
    const user = userEvent.setup();

    withClipboard(() => Promise.reject(new Error('denied')));

    await mintSecret(user);
    await user.click(screen.getByLabelText(akMT('jiraSecurity.copy')));

    expect(await screen.findByText(akMT('jiraSecurity.copyFailed'))).toBeInTheDocument();
  });
});

describe("Splunk's second step", () => {
  beforeEach(() => {
    server.use(
      http.get(
        `*/${IntegrationEndpoints.splunk('*')}`,
        () => new HttpResponse(null, { status: HTTP_STATUS_CODES.NOT_FOUND })
      ),

      http.get(`*/${IntegrationEndpoints.splunkIndexes('*')}`, () =>
        HttpResponse.json({ indexes: ['logs', 'findings'] })
      ),

      http.post(`*/${IntegrationEndpoints.splunk('*')}`, () => HttpResponse.json({}))
    );
  });

  /** Fills step one and goes on to step two, which is where the indexes are chosen. */
  const reachStepTwo = async (user: ReturnType<typeof userEvent.setup>) => {
    renderCard(<SplunkIntegration />);

    await openPanel(user);

    await user.type(
      await screen.findByPlaceholderText(akMT('splunk.enterInstanceURL')),
      'https://splunk.acme.test'
    );

    await user.type(screen.getByPlaceholderText(akMT('splunk.enterHecToken')), 'hec');
    await user.type(screen.getByPlaceholderText(akMT('splunk.enterApiToken')), 'api');
    await user.click(screen.getByText(akMT('saveAndProceed')));

    await screen.findByText(akMT('configureStep2'));
  };

  it('offers the way back to the credentials', async () => {
    const user = userEvent.setup();

    await reachStepTwo(user);
    await user.click(screen.getByLabelText(akMT('back')));

    expect(await screen.findByText(akMT('configureStep1'))).toBeInTheDocument();
    expect(screen.getByPlaceholderText(akMT('splunk.enterHecToken'))).toHaveValue('hec');
  });

  it('links out to what an index is', async () => {
    const user = userEvent.setup();

    await reachStepTwo(user);

    expect(screen.getByText(akMT('splunk.splunkIndexes')).closest('a')).toHaveAttribute(
      'target',
      '_blank'
    );
  });

  it('sends the chosen indexes and interval, with the user logs switched on', async () => {
    const user = userEvent.setup();

    const sent: Record<string, unknown>[] = [];

    server.use(
      http.post(`*/${IntegrationEndpoints.splunk('*')}`, async ({ request }) => {
        sent.push((await request.json()) as Record<string, unknown>);

        return HttpResponse.json({});
      })
    );

    await reachStepTwo(user);

    await user.click(screen.getByLabelText(akMT('splunk.sendUserLogs')));
    await user.click(await screen.findByLabelText(akMT('splunk.timeInterval')));
    await user.click(await screen.findByRole('option', { name: `48 ${akMT('hours')}` }));
    await user.click(screen.getByText(akMT('integrate')));

    expect(await screen.findByText(akMT('splunkIntegrated'))).toBeInTheDocument();

    expect(sent.at(-1)).toMatchObject({
      vulnerability_index: 'findings',
      send_user_logs: true,
      user_logs_index: 'logs',
      log_frequency_hours: 48,
    });
  });

  it('starts again from the credentials when the panel is closed unconnected', async () => {
    const user = userEvent.setup();

    await reachStepTwo(user);
    await user.click(screen.getByLabelText(akMT('close')));

    await waitFor(() => expect(screen.queryByText(akMT('configureStep2'))).not.toBeInTheDocument());

    await openPanel(user);

    expect(await screen.findByText(akMT('configureStep1'))).toBeInTheDocument();
    expect(screen.getByPlaceholderText(akMT('splunk.enterHecToken'))).toHaveValue('');
  });
});
