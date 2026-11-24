import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { OrganizationEndpoints } from '@irene/api/services/organization/endpoints';
import { clearStoredSession, storeSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';

import {
  buildOrganizationInvitation,
  buildOrganizationMembership,
  buildOrganizationTeam,
  buildOrganizationUser,
  buildSession,
} from '@tests/factories';
import { mockOrganizationMe } from '@tests/organization';
import { server } from '@tests/server';

import { EmbedProviders } from '../providers';
import { ScreenContext } from '../screen-context';
import { Organization } from './organization';

/** Renders the screen with what the host puts around it when it mounts one. */
const renderScreen = () =>
  render(
    <EmbedProviders>
      <ScreenContext>
        <Organization />
      </ScreenContext>
    </EmbedProviders>
  );

/** Puts the host at an address, the way it would be before the screen mounts. */
const hostIsAt = (pathname: string) => window.history.replaceState({}, '', pathname);

/** Answers every list the screen's panes read, so the tabs are what is under test. */
const withEmptyLists = () =>
  server.use(
    http.get(`*/${OrganizationEndpoints.namespaces('*')}`, () =>
      HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
    ),

    http.get(`*/${OrganizationEndpoints.members('*')}`, () =>
      HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
    ),

    http.get(`*/${OrganizationEndpoints.teams('*')}`, () =>
      HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
    )
  );

describe('the embedded organization screen', () => {
  beforeEach(() => {
    clearStoredSession();
    storeSession(buildSession());
    withEmptyLists();
    hostIsAt('/dashboard/organization/namespaces');
  });

  it('offers the namespaces and teams tabs to everyone', async () => {
    mockOrganizationMe({ is_owner: false, is_admin: false });

    renderScreen();

    expect(await screen.findByRole('tab', { name: new RegExp(akMT('namespaces')) })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: new RegExp(akMT('teams')) })).toBeInTheDocument();
  });

  it('keeps the users tab for an administrator', async () => {
    mockOrganizationMe({ is_owner: false, is_admin: true });

    renderScreen();

    expect(await screen.findByRole('tab', { name: new RegExp(akMT('users')) })).toBeInTheDocument();
  });

  it('withholds the users tab from everyone else', async () => {
    mockOrganizationMe({ is_owner: false, is_admin: false });

    renderScreen();

    await screen.findByRole('tab', { name: new RegExp(akMT('namespaces')) });

    expect(screen.queryByRole('tab', { name: new RegExp(akMT('users')) })).not.toBeInTheDocument();
  });

  it('keeps a pane\'s own state while it is open', async () => {
    const user = userEvent.setup();

    mockOrganizationMe({ is_owner: false, is_admin: true });
    hostIsAt('/dashboard/organization/users');

    renderScreen();

    const box = await screen.findByRole('checkbox', {
      name: akMT('includeInactiveMembers'),
    });

    await user.click(box);

    /* The pane owns the filter; the screen around it must not reset the pane. */
    await waitFor(() => expect(box).toBeChecked());
  });

  /*
    The link out of an invitation names another tab of this screen, which the
    screen's own router owns: following it must not load the page again.
  */
  it('follows the link out of an invitation into the teams tab, in place', async () => {
    const user = userEvent.setup();
    const team = buildOrganizationTeam({ id: 13, name: 'Platform' });

    mockOrganizationMe({ is_owner: false, is_admin: true });
    hostIsAt('/dashboard/organization/users');

    server.use(
      http.get(`*/${OrganizationEndpoints.members('*')}`, () =>
        HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: [buildOrganizationMembership({ member: 1 })],
        })
      ),

      http.get('*/api/organizations/:organizationId/users/:userId', () =>
        HttpResponse.json(buildOrganizationUser({ username: 'alice' }))
      ),

      http.get(`*/${OrganizationEndpoints.invitations('*')}`, () =>
        HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: [buildOrganizationInvitation({ team: team.id })],
        })
      ),

      http.get(`*/${OrganizationEndpoints.team('*', team.id)}`, () => HttpResponse.json(team))
    );

    renderScreen();

    await user.click(await screen.findByText(team.name));

    /* The teams pane is drawn, and the address it was reached by carries its search. */
    expect(await screen.findByLabelText(akMT('searchTeam'))).toHaveValue(team.name);

    expect(window.location.pathname).toBe('/dashboard/organization/teams');
    expect(new URLSearchParams(window.location.search).get('team_query')).toBe(team.name);
  });

  it('opens the pane the address names', async () => {
    mockOrganizationMe({ is_owner: false, is_admin: true });
    hostIsAt('/dashboard/organization/teams');

    renderScreen();

    expect(await screen.findByText(akMT('noTeams'))).toBeInTheDocument();
  });

  it('opens the namespaces pane where the host is on another screen', async () => {
    mockOrganizationMe({ is_owner: false, is_admin: false });
    hostIsAt('/dashboard/home');

    render(
      <EmbedProviders>
        <ScreenContext>
          <Organization />
        </ScreenContext>
      </EmbedProviders>
    );

    expect(await screen.findByText(akMT('noNamespaceRequested'))).toBeInTheDocument();
  });

  it('opens the namespaces pane where the address names no tab', async () => {
    mockOrganizationMe({ is_owner: false, is_admin: false });
    hostIsAt('/dashboard/organization');

    renderScreen();

    expect(await screen.findByText(akMT('noNamespaceRequested'))).toBeInTheDocument();
  });
});
