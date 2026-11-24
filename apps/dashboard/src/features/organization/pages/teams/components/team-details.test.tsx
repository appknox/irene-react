import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Fragment } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { OrganizationEndpoints } from '@irene/api/services/organization/endpoints';
import { organizationStore } from '@irene/api/stores/organization';
import { clearStoredSession, storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';
import { AkToaster } from '@irene/ui/ak-toaster';

import {
  buildOrganization,
  buildOrganizationMe,
  buildOrganizationInvitation,
  buildOrganizationProject,
  buildOrganizationTeam,
  buildOrganizationTeamMember,
  buildOrganizationTeamProject,
  buildOrganizationUser,
  buildProject,
  buildSession,
} from '@tests/factories';
import { renderAtAddress } from '@tests/render';
import { server } from '@tests/server';

import { OrganizationTeamsPage } from '../index';

const TEAM = buildOrganizationTeam({
  id: 13,
  name: 'Platform',
  members_count: 4,
  projects_count: 7,
});

/* The pane reads the organization from the store the signed-in routes fill. */
const inOrganizationAs = (standing: { is_admin: boolean }) =>
  organizationStore
    .getState()
    .select(buildOrganization(), buildOrganizationMe({ ...standing, is_owner: false }));

/** Answers everything the drawer reads, so a test only says what it is about. */
const withTeamRecords = ({
  members = [buildOrganizationTeamMember({ id: 7 })],
  projects = [buildOrganizationTeamProject({ id: 99 })],
  invitations = [buildOrganizationInvitation({ team: TEAM.id, email: 'ali@example.test' })],
} = {}) =>
  server.use(
    http.get(`*/${OrganizationEndpoints.teams('*')}`, () =>
      HttpResponse.json({ count: 1, next: null, previous: null, results: [TEAM] })
    ),

    http.get(`*/${OrganizationEndpoints.team('*', TEAM.id)}`, () => HttpResponse.json(TEAM)),

    http.get(`*/${OrganizationEndpoints.teamMembers('*', TEAM.id)}`, () =>
      HttpResponse.json({ count: members.length, next: null, previous: null, results: members })
    ),

    http.get(`*/${OrganizationEndpoints.teamProjects('*', TEAM.id)}`, () =>
      HttpResponse.json({ count: projects.length, next: null, previous: null, results: projects })
    ),

    http.get(`*/${OrganizationEndpoints.teamInvitations('*', TEAM.id)}`, () =>
      HttpResponse.json({
        count: invitations.length,
        next: null,
        previous: null,
        results: invitations,
      })
    ),

    http.get('*/api/organizations/:organizationId/users/:userId', () =>
      HttpResponse.json(buildOrganizationUser({ username: 'alice', email: 'alice@example.test' }))
    ),

    http.get('*/api/v3/projects/:projectId', () =>
      HttpResponse.json(buildProject({ package_name: 'com.example.app', platform: 0 }))
    )
  );

/** Opens the drawer the way a user does: by pressing the team's card. */
const openTeam = async (user: ReturnType<typeof userEvent.setup>) => {
  renderAtAddress(<Fragment>
      <OrganizationTeamsPage />

      <AkToaster />
    </Fragment>
  );

  await user.click(await screen.findByText(TEAM.name));
};

/** The one element carrying this test attribute, once it is drawn. */
const findByTestAttribute = async (name: string) => {
  const element = await waitFor(() => {
    const found = document.querySelector(`[data-test-${name}]`);

    expect(found).not.toBeNull();

    return found;
  });

  return element as HTMLElement;
};

describe('the team drawer', () => {
  beforeEach(() => {
    clearStoredSession();
    storeSession(buildSession());
    inOrganizationAs({ is_admin: true });
    withTeamRecords();
  });

  it('opens on the team behind the card, with what it holds', async () => {
    const user = userEvent.setup();

    await openTeam(user);

    expect(await screen.findByText(akMT('teamDetails'))).toBeInTheDocument();
    expect(screen.getByText(akMT('totalProjects'))).toBeInTheDocument();
    expect(screen.getByText(akMT('totalUsers'))).toBeInTheDocument();
  });

  it('lists the team’s projects, members and invitations', async () => {
    const user = userEvent.setup();

    await openTeam(user);

    expect(await screen.findByText('com.example.app')).toBeInTheDocument();
    expect(await screen.findAllByText('alice')).not.toHaveLength(0);
    expect(await screen.findByText('ali@example.test')).toBeInTheDocument();
  });

  it('keeps the members and invitations from anyone who is not an administrator', async () => {
    const user = userEvent.setup();

    inOrganizationAs({ is_admin: false });

    await openTeam(user);

    expect(await findByTestAttribute('team-project-list-title')).toBeInTheDocument();
    expect(document.querySelector('[data-test-team-member-list]')).not.toBeInTheDocument();
    expect(screen.queryByText(akMT('teamInvitations'))).not.toBeInTheDocument();
    expect(screen.queryByText(akMT('deleteTeam'))).not.toBeInTheDocument();
  });

  it('renames the team from the pane behind the edit control', async () => {
    const user = userEvent.setup();
    let sentName = '';

    server.use(
      http.put(`*/${OrganizationEndpoints.team('*', TEAM.id)}`, async ({ request }) => {
        sentName = ((await request.json()) as { name: string }).name;

        return HttpResponse.json({ ...TEAM, name: sentName });
      })
    );

    await openTeam(user);
    await user.click(await screen.findByText(akMT('editTeamName')));

    const field = await screen.findByLabelText(akMT('editTeamNameInputLabel'));

    await user.clear(field);
    await user.type(field, 'Security');
    await user.click(screen.getByText(akMT('edit')));

    await waitFor(() => expect(sentName).toBe('Security'));
  });

  it('leaves the rename unavailable until the name is changed', async () => {
    const user = userEvent.setup();

    await openTeam(user);
    await user.click(await screen.findByText(akMT('editTeamName')));

    expect(screen.getByText(akMT('edit')).closest('button')).toBeDisabled();
  });

  it('returns to the team from a pane', async () => {
    const user = userEvent.setup();

    await openTeam(user);
    await user.click(await screen.findByText(akMT('editTeamName')));
    await user.click(await screen.findByText(akMT('back')));

    expect(await screen.findByText(akMT('totalProjects'))).toBeInTheDocument();
  });

  it('adds the people picked from the organization to the team', async () => {
    const user = userEvent.setup();
    const added: string[] = [];

    server.use(
      http.get(`*/${OrganizationEndpoints.users('*')}`, () =>
        HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: [buildOrganizationUser({ id: 21, username: 'bob' })],
        })
      ),

      http.put('*/api/organizations/:organizationId/teams/:teamId/members/:userId', ({ params }) => {
        added.push(String(params.userId));

        return HttpResponse.json({});
      })
    );

    await openTeam(user);
    await user.click(await screen.findByText(akMT('addUser')));

    await user.click(await screen.findByLabelText(`${akMT('addUser')} bob`));
    await user.click(screen.getByText(akMT('addUsers'), { selector: 'button *, button' }));

    await waitFor(() => expect(added).toContain('21'));
  });

  it('adds the projects picked from the organization to the team', async () => {
    const user = userEvent.setup();
    const added: string[] = [];

    server.use(
      http.get(`*/${OrganizationEndpoints.projects('*')}`, () =>
        HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: [buildOrganizationProject({ id: 31, package_name: 'com.example.other' })],
        })
      ),

      http.put(
        '*/api/organizations/:organizationId/teams/:teamId/projects/:projectId',
        ({ params }) => {
          added.push(String(params.projectId));

          return HttpResponse.json({});
        }
      )
    );

    await openTeam(user);
    await user.click(await screen.findByText(akMT('addProject')));

    await user.click(await screen.findByLabelText(`${akMT('addProject')} com.example.other`));
    await user.click(await findByTestAttribute('team-action-confirm'));

    await waitFor(() => expect(added).toContain('31'));
  });

  it('invites someone into the team by address', async () => {
    const user = userEvent.setup();
    let invited = '';

    server.use(
      http.post(`*/${OrganizationEndpoints.teamInvitations('*', TEAM.id)}`, async ({ request }) => {
        invited = ((await request.json()) as { email: string }).email;

        return HttpResponse.json({});
      })
    );

    await openTeam(user);
    await user.click(await screen.findByText(akMT('inviteUsers')));

    await user.type(await findByTestAttribute('team-invite-emails'), 'new@example.test');
    await user.click(await findByTestAttribute('team-action-confirm'));

    await waitFor(() => expect(invited).toBe('new@example.test'));
  });

  it('sets whether the team may write to one of its projects', async () => {
    const user = userEvent.setup();
    let sentWrite: boolean | null = null;

    server.use(
      http.put(
        '*/api/organizations/:organizationId/teams/:teamId/projects/:projectId',
        async ({ request }) => {
          sentWrite = ((await request.json()) as { write: boolean }).write;

          return HttpResponse.json(buildOrganizationTeamProject({ id: 99, write: true }));
        }
      )
    );

    await openTeam(user);
    await user.click(await findByTestAttribute('team-project-write'));

    await waitFor(() => expect(sentWrite).toBe(true));
  });

  it('removes a project from the team once the question is answered', async () => {
    const user = userEvent.setup();
    let removed = false;

    server.use(
      http.delete('*/api/organizations/:organizationId/teams/:teamId/projects/:projectId', () => {
        removed = true;

        return HttpResponse.json({});
      })
    );

    await openTeam(user);
    await user.click(await findByTestAttribute('team-project-remove'));

    const box = await findByTestAttribute('confirm-box');

    await user.click(within(box).getByText(akMT('remove')));

    await waitFor(() => expect(removed).toBe(true));
  });

  it('removes a member only once their name has been typed', async () => {
    const user = userEvent.setup();
    let removed = false;

    server.use(
      http.delete('*/api/organizations/:organizationId/teams/:teamId/members/:userId', () => {
        removed = true;

        return HttpResponse.json({});
      })
    );

    await openTeam(user);
    await user.click(await findByTestAttribute('team-member-remove'));

    const box = await findByTestAttribute('confirm-box');

    await user.click(within(box).getByText(akMT('remove')));

    expect(await screen.findByText(akMT('enterRightUserName'))).toBeInTheDocument();
    expect(removed).toBe(false);

    await user.type(await findByTestAttribute('team-member-remove-prompt'), 'alice');
    await user.click(within(box).getByText(akMT('remove')));

    await waitFor(() => expect(removed).toBe(true));
  });

  it('removes the team only once its name has been typed', async () => {
    const user = userEvent.setup();
    let removed = false;

    server.use(
      http.delete(`*/${OrganizationEndpoints.team('*', TEAM.id)}`, () => {
        removed = true;

        return HttpResponse.json({});
      })
    );

    await openTeam(user);
    await user.click(await findByTestAttribute('team-delete'));

    const box = await findByTestAttribute('confirm-box');

    await user.click(within(box).getByText(akMT('deleteTeam')));

    expect(await screen.findByText(akMT('enterRightTeamName'))).toBeInTheDocument();
    expect(removed).toBe(false);

    await user.type(await findByTestAttribute('team-delete-prompt'), 'platform');
    await user.click(within(box).getByText(akMT('deleteTeam')));

    await waitFor(() => expect(removed).toBe(true));
  });

  it('says what went wrong when the team cannot be removed', async () => {
    const user = userEvent.setup();

    server.use(
      http.delete(`*/${OrganizationEndpoints.team('*', TEAM.id)}`, () =>
        HttpResponse.json({ detail: 'Team is in use' }, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    await openTeam(user);
    await user.click(await findByTestAttribute('team-delete'));

    await user.type(await findByTestAttribute('team-delete-prompt'), 'Platform');
    await user.click(within(await findByTestAttribute('confirm-box')).getByText(akMT('deleteTeam')));

    expect(await screen.findByText('Team is in use')).toBeInTheDocument();
  });

  it('says there is nothing in the team where it holds nothing', async () => {
    const user = userEvent.setup();

    withTeamRecords({ members: [], projects: [], invitations: [] });

    await openTeam(user);

    expect(await screen.findByText(akMT('noProject'))).toBeInTheDocument();
    expect(await screen.findByText(akMT('noMembers'))).toBeInTheDocument();
    expect(await screen.findByText(akMT('noInvitations'))).toBeInTheDocument();
  });

  it('closes on the control in its own bar', async () => {
    const user = userEvent.setup();

    await openTeam(user);
    await user.click(await screen.findByLabelText(akMT('close')));

    await waitFor(() =>
      expect(screen.queryByText(akMT('teamDetails'))).not.toBeInTheDocument()
    );
  });
});
