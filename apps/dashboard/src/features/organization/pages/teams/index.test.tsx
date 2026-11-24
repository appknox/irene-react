import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { OrganizationEndpoints } from '@irene/api/services/organization/endpoints';
import { organizationStore } from '@irene/api/stores/organization';
import { clearStoredSession, storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';

import {
  buildOrganization,
  buildOrganizationMe,
  buildOrganizationTeam,
  buildSession,
} from '@tests/factories';
import { renderAtAddress } from '@tests/render';
import { server } from '@tests/server';

import { OrganizationTeamsPage } from './index';

let lastParams: URLSearchParams;

/* The pane reads the organization from the store the signed-in routes fill. */
const inOrganizationAs = (standing: { is_admin: boolean }) =>
  organizationStore
    .getState()
    .select(buildOrganization(), buildOrganizationMe({ ...standing, is_owner: false }));

/** Answers the teams list with these rows, recording what was asked for. */
const withTeams = (teams: ReturnType<typeof buildOrganizationTeam>[], count = teams.length) =>
  server.use(
    http.get(`*/${OrganizationEndpoints.teams('*')}`, ({ request }) => {
      lastParams = new URL(request.url).searchParams;

      return HttpResponse.json({ count, next: null, previous: null, results: teams });
    })
  );

describe('OrganizationTeamsPage', () => {
  beforeEach(() => {
    clearStoredSession();
    storeSession(buildSession());
    inOrganizationAs({ is_admin: true });
  });

  it('lists a team with what is in it', async () => {
    withTeams([buildOrganizationTeam({ name: 'Platform', members_count: 4, projects_count: 7 })]);

    renderAtAddress(<OrganizationTeamsPage />, '/dashboard/organization/teams');

    expect(await screen.findByText('Platform')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('tells an administrator there are no teams to manage', async () => {
    withTeams([]);

    renderAtAddress(<OrganizationTeamsPage />, '/dashboard/organization/teams');

    expect(await screen.findByText(akMT('noTeams'))).toBeInTheDocument();
  });

  it('tells everyone else they belong to none', async () => {
    inOrganizationAs({ is_admin: false });
    withTeams([]);

    renderAtAddress(<OrganizationTeamsPage />, '/dashboard/organization/teams');

    expect(await screen.findByText(akMT('noTeamsMember'))).toBeInTheDocument();
  });

  it('searches the teams by what is typed', async () => {
    const user = userEvent.setup();

    withTeams([buildOrganizationTeam()]);

    renderAtAddress(<OrganizationTeamsPage />, '/dashboard/organization/teams');
    await screen.findByRole('list');

    await user.type(screen.getByRole('textbox', { name: akMT('searchTeam') }), 'plat');

    await waitFor(() => expect(lastParams.get('q')).toBe('plat'));
  });

  it('offers an administrator the way to start a team', async () => {
    withTeams([]);

    renderAtAddress(<OrganizationTeamsPage />, '/dashboard/organization/teams');

    expect(
      await screen.findByRole('button', { name: new RegExp(akMT('createTeam')) })
    ).toBeInTheDocument();
  });

  it('withholds it from everyone else', async () => {
    inOrganizationAs({ is_admin: false });
    withTeams([]);

    renderAtAddress(<OrganizationTeamsPage />, '/dashboard/organization/teams');

    await screen.findByText(akMT('noTeamsMember'));

    expect(
      screen.queryByRole('button', { name: new RegExp(akMT('createTeam')) })
    ).not.toBeInTheDocument();
  });

  it('starts a team and says so', async () => {
    const user = userEvent.setup();

    withTeams([]);

    server.use(
      http.post(`*/${OrganizationEndpoints.teams('*')}`, () =>
        HttpResponse.json(buildOrganizationTeam({ name: 'Platform' }))
      )
    );

    renderAtAddress(<OrganizationTeamsPage />, '/dashboard/organization/teams');

    await user.click(await screen.findByRole('button', { name: new RegExp(akMT('createTeam')) }));

    const dialog = await screen.findByRole('dialog');

    await user.type(within(dialog).getByRole('textbox'), 'Platform');
    await user.click(within(dialog).getByRole('button', { name: akMT('createTeam') }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('refuses a team with no name before asking the server', async () => {
    const user = userEvent.setup();

    withTeams([]);

    renderAtAddress(<OrganizationTeamsPage />, '/dashboard/organization/teams');

    await user.click(await screen.findByRole('button', { name: new RegExp(akMT('createTeam')) }));

    const dialog = await screen.findByRole('dialog');

    await user.click(within(dialog).getByRole('button', { name: akMT('createTeam') }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('keeps the panel open when starting a team is refused', async () => {
    const user = userEvent.setup();

    withTeams([]);

    server.use(
      http.post(`*/${OrganizationEndpoints.teams('*')}`, () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    renderAtAddress(<OrganizationTeamsPage />, '/dashboard/organization/teams');

    await user.click(await screen.findByRole('button', { name: new RegExp(akMT('createTeam')) }));

    const dialog = await screen.findByRole('dialog');

    await user.type(within(dialog).getByRole('textbox'), 'Platform');
    await user.click(within(dialog).getByRole('button', { name: akMT('createTeam') }));

    await waitFor(() => expect(within(dialog).getByRole('textbox')).toHaveValue('Platform'));
  });

  it('pages through the teams', async () => {
    withTeams([buildOrganizationTeam()], 42);

    renderAtAddress(<OrganizationTeamsPage />, '/dashboard/organization/teams');

    expect(await screen.findByText(/of 42/)).toBeInTheDocument();
  });
});
