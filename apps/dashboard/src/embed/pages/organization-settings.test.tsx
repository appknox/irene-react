import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { IntegrationEndpoints } from '@irene/api/services/integration/endpoints';
import { OrganizationEndpoints } from '@irene/api/services/organization/endpoints';
import { organizationStore } from '@irene/api/stores/organization';
import { clearStoredSession, storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';

import { buildOrganization, buildOrganizationMe, buildSession } from '@tests/factories';
import { server } from '@tests/server';

import { EmbedProviders } from '../providers';
import { OrganizationSettings } from './organization-settings';

const notFound = () => new HttpResponse(null, { status: HTTP_STATUS_CODES.NOT_FOUND });

/** Renders the screen as a host does: in the embed's own providers, nothing passed. */
const renderScreen = () =>
  render(
    <EmbedProviders>
      <OrganizationSettings />
    </EmbedProviders>
  );

beforeEach(() => {
  clearStoredSession();
  storeSession(buildSession());

  const organization = buildOrganization();

  /* The AI tab is offered only to an organization that has one of those features. */
  organization.ai_features = { reporting: true, pii: false, knoxiq: false, ai_dast: false };

  organizationStore
    .getState()
    .select(organization, buildOrganizationMe({ is_owner: true, is_admin: true }));

  window.history.replaceState({}, '', '/dashboard/organization/settings');

  server.use(
    http.get(`*/${IntegrationEndpoints.github('*')}`, () => HttpResponse.json(null)),
    http.get(`*/${IntegrationEndpoints.jira('*')}`, notFound),
    http.get(`*/${IntegrationEndpoints.serviceNow('*')}`, notFound),
    http.get(`*/${IntegrationEndpoints.slack('*')}`, notFound),
    http.get(`*/${IntegrationEndpoints.splunk('*')}`, notFound),

    http.get(`*/${IntegrationEndpoints.jiraSecurity('*')}`, () =>
      HttpResponse.json({
        status: 'not_connected',
        connected_on: null,
        configure_path: '/configure',
        auto_push: false,
      })
    ),

    http.get(`*/${OrganizationEndpoints.aiFeatures('*')}`, () =>
      HttpResponse.json({ reporting: false, pii: false })
    )
  );
});

describe('the embedded settings screen', () => {
  it('opens on the first tab it owns, and writes that address', async () => {
    renderScreen();

    expect(await screen.findByText(akMT('github'))).toBeInTheDocument();

    await waitFor(() =>
      expect(window.location.pathname).toBe('/dashboard/organization/settings/integrations')
    );
  });

  it('names the open pane in the browser tab, ahead of what the host named the page', async () => {
    document.title = 'Organization Settings';

    renderScreen();

    await waitFor(() =>
      expect(document.title).toBe(`${akMT('integration')} | Organization Settings`)
    );
  });

  it('opens on the tab the address names', async () => {
    window.history.replaceState({}, '', '/dashboard/organization/settings/ai-powered-features');

    renderScreen();

    expect(await screen.findByText(akMT('aiPoweredFeatures'))).toBeInTheDocument();
  });

  it('hands a tab it does not own back to the host, as an ordinary link', async () => {
    renderScreen();

    const settingsTab = await screen.findByText(akMT('organizationSettings'));

    expect(settingsTab.closest('a')).toHaveAttribute('href', '/dashboard/organization/settings');
  });

  it('follows a tab it owns without leaving the screen', async () => {
    const user = userEvent.setup();

    renderScreen();

    await user.click(await screen.findByText(akMT('aiPoweredFeatures')));

    await waitFor(() =>
      expect(window.location.pathname).toBe('/dashboard/organization/settings/ai-powered-features')
    );
  });
});
