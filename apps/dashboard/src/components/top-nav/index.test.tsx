import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthEndpoints } from '@irene/api/services/auth/endpoints';
import { ConfigurationEndpoints } from '@irene/api/services/configuration/endpoints';
import { UserEndpoints } from '@irene/api/services/user/endpoints';
import { storeSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';
import type { ApiFrontendIntegrations } from '@irene/api/services/configuration';

import {
  buildFrontendConfiguration,
  buildSession,
  buildUser,
  buildUserResponse,
} from '@tests/factories';

import { mockOrganizationFeatures } from '@tests/organization';
import { renderAtRoute } from '@tests/render';
import { server } from '@tests/server';

const PROJECTS = '/dashboard/projects';

const session = buildSession();

const user = buildUser({ username: 'ada-lovelace', email: 'ada@appknox.com' });

const openProjects = () => renderAtRoute(PROJECTS);

/** Answers the frontend configuration with the third-party keys a test needs. */
const mockIntegrations = (integrations: Partial<ApiFrontendIntegrations>) => {
  const configuration = buildFrontendConfiguration();

  server.use(
    http.get(`*/${ConfigurationEndpoints.frontend()}`, () =>
      HttpResponse.json({
        ...configuration,
        integrations: { ...configuration.integrations, ...integrations },
      })
    )
  );
};

const openProfileMenu = () => userEvent.click(screen.getByRole('button', { name: user.username }));

describe('TopNav', () => {
  beforeEach(() => {
    storeSession(session);
    mockOrganizationFeatures({});

    server.use(
      http.get(`*/${UserEndpoints.detail(session.userId)}`, () =>
        HttpResponse.json(buildUserResponse(user))
      )
    );
  });

  it('names the signed-in account on the control that opens its menu', async () => {
    await openProjects();

    expect(await screen.findByRole('button', { name: user.username })).toBeInTheDocument();
  });

  it('states the account and the address it signed in with', async () => {
    await openProjects();

    await waitFor(() => expect(screen.getByRole('button', { name: user.username })).toBeEnabled());
    await openProfileMenu();

    expect(await screen.findByRole('menuitem', { name: user.email ?? '' })).toBeInTheDocument();
  });

  it('offers support where the deployment carries a chat key', async () => {
    mockIntegrations({ freshchat_key: 'a-freshchat-key' });

    await openProjects();

    await waitFor(() => expect(screen.getByRole('button', { name: user.username })).toBeEnabled());
    await openProfileMenu();

    expect(await screen.findByRole('menuitem', { name: akMT('support') })).toBeInTheDocument();
  });

  it('offers no support on a deployment that carries no chat key', async () => {
    mockIntegrations({ freshchat_key: '' });

    await openProjects();

    await waitFor(() => expect(screen.getByRole('button', { name: user.username })).toBeEnabled());
    await openProfileMenu();

    await screen.findByRole('menu');

    expect(screen.queryByRole('menuitem', { name: akMT('support') })).not.toBeInTheDocument();
  });

  it('points the menu at the control that opened it', async () => {
    await openProjects();

    await waitFor(() => expect(screen.getByRole('button', { name: user.username })).toBeEnabled());
    await openProfileMenu();

    await screen.findByRole('menu');

    expect(document.querySelector('[data-slot="menu-arrow"]')).toBeInTheDocument();
  });

  it('offers the knowledge base where the deployment names a support widget', async () => {
    mockIntegrations({ freshdesk_configuration: { widget_id: '42' } });

    await openProjects();

    expect(await screen.findByRole('button', { name: akMT('knowledgeBase') })).toBeInTheDocument();
  });

  it('offers no knowledge base on a deployment that names no support widget', async () => {
    mockIntegrations({ freshdesk_configuration: { widget_id: '' } });

    await openProjects();

    await waitFor(() => expect(screen.getByRole('button', { name: user.username })).toBeEnabled());

    expect(screen.queryByRole('button', { name: akMT('knowledgeBase') })).not.toBeInTheDocument();
  });

  it('opens the support widget from the knowledge base control', async () => {
    const widget = vi.fn();

    window.FreshworksWidget = widget;

    mockIntegrations({ freshdesk_configuration: { widget_id: '42' } });

    await openProjects();

    await userEvent.click(await screen.findByRole('button', { name: akMT('knowledgeBase') }));

    expect(widget).toHaveBeenCalledWith('open');

    delete window.FreshworksWidget;
  });

  it('signs the account out and returns it to the login page', async () => {
    server.use(http.post(`*/${AuthEndpoints.logout()}`, () => HttpResponse.json({})));

    const { router } = await openProjects();

    await waitFor(() => expect(screen.getByRole('button', { name: user.username })).toBeEnabled());
    await openProfileMenu();

    await userEvent.click(await screen.findByRole('menuitem', { name: akMT('logout') }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });
});
