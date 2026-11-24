import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
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

const TEAM = buildOrganizationTeam({ id: 13, name: 'Platform' });

/** The one element carrying this test attribute, once it is drawn. */
const findByTestAttribute = async (name: string) => {
  const element = await waitFor(() => {
    const found = document.querySelector(`[data-test-${name}]`);

    expect(found).not.toBeNull();

    return found;
  });

  return element as HTMLElement;
};

/** Answers everything the drawer reads, so a test only says what it is about. */
const withTeamRecords = () =>
  server.use(
    http.get(`*/${OrganizationEndpoints.teams('*')}`, () =>
      HttpResponse.json({ count: 1, next: null, previous: null, results: [TEAM] })
    ),

    http.get(`*/${OrganizationEndpoints.team('*', TEAM.id)}`, () => HttpResponse.json(TEAM)),

    http.get(`*/${OrganizationEndpoints.teamMembers('*', TEAM.id)}`, () =>
      HttpResponse.json({
        count: 7,
        next: null,
        previous: null,
        results: [buildOrganizationTeamMember({ id: 7 })],
      })
    ),

    http.get(`*/${OrganizationEndpoints.teamProjects('*', TEAM.id)}`, () =>
      HttpResponse.json({
        count: 7,
        next: null,
        previous: null,
        results: [buildOrganizationTeamProject({ id: 99 })],
      })
    ),

    http.get(`*/${OrganizationEndpoints.teamInvitations('*', TEAM.id)}`, () =>
      HttpResponse.json({
        count: 7,
        next: null,
        previous: null,
        results: [buildOrganizationInvitation({ team: TEAM.id, email: 'ali@example.test' })],
      })
    ),

    http.get('*/api/organizations/:organizationId/users/:userId', () =>
      HttpResponse.json(buildOrganizationUser({ username: 'alice', email: 'alice@example.test' }))
    ),

    http.get('*/api/v3/projects/:projectId', () =>
      HttpResponse.json(buildProject({ package_name: 'com.example.app', platform: 1 }))
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

/** Answers the list of people to add with these rows. */
const withCandidateUsers = (
  users: ReturnType<typeof buildOrganizationUser>[],
  count = users.length
) =>
  server.use(
    http.get(`*/${OrganizationEndpoints.users('*')}`, () =>
      HttpResponse.json({ count, next: null, previous: null, results: users })
    )
  );

/** Answers the list of projects to add with these rows. */
const withCandidateProjects = (
  projects: ReturnType<typeof buildOrganizationProject>[],
  count = projects.length
) =>
  server.use(
    http.get(`*/${OrganizationEndpoints.projects('*')}`, () =>
      HttpResponse.json({ count, next: null, previous: null, results: projects })
    )
  );

describe('the team drawer’s panes', () => {
  beforeEach(() => {
    clearStoredSession();
    storeSession(buildSession());

    organizationStore
      .getState()
      .select(buildOrganization(), buildOrganizationMe({ is_admin: true, is_owner: false }));

    withTeamRecords();
  });

  /* The card already holds the team, so the drawer has something to draw at once. */
  it('opens on the team the card showed, before the team itself has been read', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`*/${OrganizationEndpoints.team('*', TEAM.id)}`, async () => {
        await delay('infinite');

        return HttpResponse.json(TEAM);
      })
    );

    await openTeam(user);

    expect(await findByTestAttribute('team-info-name')).toHaveTextContent(TEAM.name);
  });

  /*
    Each list is read on its own, so setting the access on one project leaves
    the members and the invitations beside it alone.
  */
  it('leaves the other lists alone when the write access is set', async () => {
    const user = userEvent.setup();
    let memberReads = 0;

    server.use(
      http.get(`*/${OrganizationEndpoints.teamMembers('*', TEAM.id)}`, () => {
        memberReads += 1;

        return HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: [buildOrganizationTeamMember({ id: 7 })],
        });
      }),

      http.put('*/api/organizations/:organizationId/teams/:teamId/projects/:projectId', () =>
        HttpResponse.json(buildOrganizationTeamProject({ id: 99, write: true }))
      )
    );

    await openTeam(user);
    await screen.findByText('com.example.app');

    const readsBefore = memberReads;

    await user.click(await findByTestAttribute('team-project-write'));

    expect(await screen.findByText(akMT('permissionChanged'))).toBeInTheDocument();

    /* The access shows as set, and the project table was never emptied to show it. */
    expect(await findByTestAttribute('team-project-write')).toBeChecked();
    expect(await findByTestAttribute('team-project-list-table')).toBeInTheDocument();
    expect(memberReads).toBe(readsBefore);
  });

  it('says what went wrong when a rename is refused', async () => {
    const user = userEvent.setup();

    server.use(
      http.put(`*/${OrganizationEndpoints.team('*', TEAM.id)}`, () =>
        HttpResponse.json(
          { detail: 'That name is taken' },
          { status: HTTP_STATUS_CODES.BAD_REQUEST }
        )
      )
    );

    await openTeam(user);
    await user.click(await screen.findByText(akMT('editTeamName')));

    await user.type(await screen.findByLabelText(akMT('editTeamNameInputLabel')), ' two');
    await user.click(screen.getByText(akMT('edit')));

    expect(await screen.findByText('That name is taken')).toBeInTheDocument();
  });

  it('says what went wrong when a member cannot be added', async () => {
    const user = userEvent.setup();

    withCandidateUsers([buildOrganizationUser({ id: 21, username: 'bob' })]);

    server.use(
      http.put('*/api/organizations/:organizationId/teams/:teamId/members/:userId', () =>
        HttpResponse.json(
          { detail: 'Not allowed in this team' },
          { status: HTTP_STATUS_CODES.BAD_REQUEST }
        )
      )
    );

    await openTeam(user);
    await user.click(await screen.findByText(akMT('addUser')));

    await user.click(await screen.findByLabelText(`${akMT('addUser')} bob`));
    await user.click(await findByTestAttribute('team-action-confirm'));

    expect(await screen.findByText('Not allowed in this team')).toBeInTheDocument();
  });

  it('leaves the add unavailable until someone is picked, and lets a pick be undone', async () => {
    const user = userEvent.setup();

    withCandidateUsers([buildOrganizationUser({ id: 21, username: 'bob' })]);

    await openTeam(user);
    await user.click(await screen.findByText(akMT('addUser')));

    expect(await findByTestAttribute('team-action-confirm')).toBeDisabled();

    await user.click(await screen.findByLabelText(`${akMT('addUser')} bob`));

    expect(await findByTestAttribute('team-action-confirm')).toBeEnabled();

    /* Picked and unpicked leaves nothing to add, so the action closes again. */
    await user.click(await screen.findByLabelText(`${akMT('addUser')} bob`));

    expect(await findByTestAttribute('team-action-confirm')).toBeDisabled();
  });

  it('says there is nobody left to add once everyone is in the team', async () => {
    const user = userEvent.setup();

    withCandidateUsers([]);

    await openTeam(user);
    await user.click(await screen.findByText(akMT('addUser')));

    expect(await findByTestAttribute('add-members-empty')).toBeInTheDocument();
  });

  it('searches the people it offers, and starts that search at its first page', async () => {
    const user = userEvent.setup();
    let asked = new URLSearchParams();

    server.use(
      http.get(`*/${OrganizationEndpoints.users('*')}`, ({ request }) => {
        asked = new URL(request.url).searchParams;

        return HttpResponse.json({
          count: 40,
          next: null,
          previous: null,
          results: [buildOrganizationUser({ id: 21, username: 'bob' })],
        });
      })
    );

    await openTeam(user);
    await user.click(await screen.findByText(akMT('addUser')));

    await user.type(await findByTestAttribute('add-member-search'), 'bo');

    await waitFor(() => expect(asked.get('q')).toBe('bo'), { timeout: 2000 });

    expect(asked.get('offset')).toBe('0');
  });

  it('marks an iOS project it offers with the platform it is built for, and lets a pick be undone', async () => {
    const user = userEvent.setup();

    withCandidateProjects([
      buildOrganizationProject({ id: 31, package_name: 'com.example.ios', platform: 1 }),
    ]);

    await openTeam(user);
    await user.click(await screen.findByText(akMT('addProject')));

    const pick = await screen.findByLabelText(`${akMT('addProject')} com.example.ios`);

    await user.click(pick);

    expect(await findByTestAttribute('team-action-confirm')).toBeEnabled();

    await user.click(await screen.findByLabelText(`${akMT('addProject')} com.example.ios`));

    expect(await findByTestAttribute('team-action-confirm')).toBeDisabled();
  });

  it('says there is nothing left to add once every project is in the team', async () => {
    const user = userEvent.setup();

    withCandidateProjects([]);

    await openTeam(user);
    await user.click(await screen.findByText(akMT('addProject')));

    expect(await findByTestAttribute('add-projects-empty')).toBeInTheDocument();
  });

  it('says what went wrong when a project cannot be added', async () => {
    const user = userEvent.setup();

    withCandidateProjects([buildOrganizationProject({ id: 31, package_name: 'com.example.other' })]);

    server.use(
      http.put('*/api/organizations/:organizationId/teams/:teamId/projects/:projectId', () =>
        HttpResponse.json({ detail: 'Project is archived' }, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    await openTeam(user);
    await user.click(await screen.findByText(akMT('addProject')));

    await user.click(await screen.findByLabelText(`${akMT('addProject')} com.example.other`));
    await user.click(await findByTestAttribute('team-action-confirm'));

    expect(await screen.findByText('Project is archived')).toBeInTheDocument();
  });

  it('says what went wrong when the write access cannot be set', async () => {
    const user = userEvent.setup();

    server.use(
      http.put('*/api/organizations/:organizationId/teams/:teamId/projects/:projectId', () =>
        HttpResponse.json({ detail: 'Read-only project' }, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    await openTeam(user);
    await user.click(await findByTestAttribute('team-project-write'));

    expect(await screen.findByText('Read-only project')).toBeInTheDocument();
  });

  it('says what went wrong when a project cannot be taken out of the team', async () => {
    const user = userEvent.setup();

    server.use(
      http.delete('*/api/organizations/:organizationId/teams/:teamId/projects/:projectId', () =>
        HttpResponse.json({ detail: 'Last project' }, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    await openTeam(user);
    await user.click(await findByTestAttribute('team-project-remove'));

    await user.click(
      within(await findByTestAttribute('confirm-box')).getByText(akMT('remove'))
    );

    expect(await screen.findByText('Last project')).toBeInTheDocument();
  });

  it('says what went wrong when a member cannot be taken out of the team', async () => {
    const user = userEvent.setup();

    server.use(
      http.delete('*/api/organizations/:organizationId/teams/:teamId/members/:userId', () =>
        HttpResponse.json({ detail: 'Last administrator' }, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    await openTeam(user);
    await user.click(await findByTestAttribute('team-member-remove'));

    await user.type(await findByTestAttribute('team-member-remove-prompt'), 'alice');

    await user.click(
      within(await findByTestAttribute('confirm-box')).getByText(akMT('remove'))
    );

    expect(await screen.findByText('Last administrator')).toBeInTheDocument();
  });

  it('leaves a removal alone once the question is dismissed', async () => {
    const user = userEvent.setup();

    await openTeam(user);
    await user.click(await findByTestAttribute('team-delete'));

    await user.click(
      within(await findByTestAttribute('confirm-box')).getByText(akMT('cancel'))
    );

    await waitFor(() =>
      expect(document.querySelector('[data-test-confirm-box]')).not.toBeInTheDocument()
    );
  });

  it('says an address is needed when none was typed', async () => {
    const user = userEvent.setup();

    await openTeam(user);
    await user.click(await screen.findByText(akMT('inviteUsers')));

    await user.click(await findByTestAttribute('team-action-confirm'));

    expect(await screen.findByText(akMT('emptyEmailId'))).toBeInTheDocument();
  });

  it('drops an address from the invitation when its chip is removed', async () => {
    const user = userEvent.setup();

    await openTeam(user);
    await user.click(await screen.findByText(akMT('inviteUsers')));

    await user.type(await findByTestAttribute('team-invite-emails'), 'new@example.test');

    const chip = await findByTestAttribute('team-invite-chip');

    await user.click(within(chip).getByRole('button'));

    await waitFor(() =>
      expect(document.querySelector('[data-test-team-invite-chip]')).not.toBeInTheDocument()
    );
  });

  it('says what went wrong when an invitation is refused', async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`*/${OrganizationEndpoints.teamInvitations('*', TEAM.id)}`, () =>
        HttpResponse.json({ detail: 'Already invited' }, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    await openTeam(user);
    await user.click(await screen.findByText(akMT('inviteUsers')));

    await user.type(await findByTestAttribute('team-invite-emails'), 'new@example.test');
    await user.click(await findByTestAttribute('team-action-confirm'));

    expect(await screen.findByText('Already invited')).toBeInTheDocument();
  });

  it('searches the projects it offers, and starts that search at its first page', async () => {
    const user = userEvent.setup();
    let asked = new URLSearchParams();

    server.use(
      http.get(`*/${OrganizationEndpoints.projects('*')}`, ({ request }) => {
        asked = new URL(request.url).searchParams;

        return HttpResponse.json({
          count: 40,
          next: null,
          previous: null,
          results: [buildOrganizationProject({ id: 31, package_name: 'com.example.other' })],
        });
      })
    );

    await openTeam(user);
    await user.click(await screen.findByText(akMT('addProject')));

    await user.type(await findByTestAttribute('add-project-search'), 'oth');

    await waitFor(() => expect(asked.get('q')).toBe('oth'), { timeout: 2000 });

    expect(asked.get('offset')).toBe('0');
  });

  it('asks for the next page of the projects it offers', async () => {
    const user = userEvent.setup();
    const offsets: string[] = [];

    server.use(
      http.get(`*/${OrganizationEndpoints.projects('*')}`, ({ request }) => {
        offsets.push(new URL(request.url).searchParams.get('offset') ?? '');

        return HttpResponse.json({
          count: 40,
          next: null,
          previous: null,
          results: [buildOrganizationProject({ id: 31, package_name: 'com.example.other' })],
        });
      })
    );

    await openTeam(user);
    await user.click(await screen.findByText(akMT('addProject')));
    await screen.findByText('com.example.other');

    const pane = await findByTestAttribute('add-team-projects');

    await user.click(within(pane).getByRole('button', { name: akMT('next') }));

    await waitFor(() => expect(offsets).toContain('10'));
  });

  it('names a team project by its id alone until the package behind it arrives', async () => {
    const user = userEvent.setup();

    server.use(
      http.get('*/api/v3/projects/:projectId', () =>
        HttpResponse.json({ detail: 'Gone' }, { status: HTTP_STATUS_CODES.NOT_FOUND })
      )
    );

    await openTeam(user);

    const row = await findByTestAttribute('team-project-info');

    expect(row).toBeInTheDocument();
    expect(row).toHaveTextContent('');
  });

  it('changes how many of a team’s records are shown at once', async () => {
    const user = userEvent.setup();
    const limits: string[] = [];

    server.use(
      http.get(`*/${OrganizationEndpoints.teamMembers('*', TEAM.id)}`, ({ request }) => {
        limits.push(new URL(request.url).searchParams.get('limit') ?? '');

        return HttpResponse.json({
          count: 7,
          next: null,
          previous: null,
          results: [buildOrganizationTeamMember({ id: 7 })],
        });
      })
    );

    await openTeam(user);

    const members = await findByTestAttribute('team-member-list');

    await user.click(within(members).getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: '20' }));

    await waitFor(() => expect(limits).toContain('20'));
  });

  /*
    The API does not always say what went wrong, and the drawer still has to
    say something, so each of these falls back to the same line.
  */
  it('falls back to asking for another try where the refusal says nothing', async () => {
    const user = userEvent.setup();

    server.use(
      http.put('*/api/organizations/:organizationId/teams/:teamId/projects/:projectId', () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      ),

      http.delete('*/api/organizations/:organizationId/teams/:teamId/members/:userId', () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    await openTeam(user);
    await user.click(await findByTestAttribute('team-project-write'));

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
  });

  it('falls back to asking for another try where a removal is refused without a reason', async () => {
    const user = userEvent.setup();

    server.use(
      http.delete('*/api/organizations/:organizationId/teams/:teamId/members/:userId', () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    await openTeam(user);
    await user.click(await findByTestAttribute('team-member-remove'));

    await user.type(await findByTestAttribute('team-member-remove-prompt'), 'alice');

    await user.click(
      within(await findByTestAttribute('confirm-box')).getByText(akMT('remove'))
    );

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
  });

  it('falls back to asking for another try where an invitation is refused without a reason', async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`*/${OrganizationEndpoints.teamInvitations('*', TEAM.id)}`, () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    await openTeam(user);
    await user.click(await screen.findByText(akMT('inviteUsers')));

    await user.type(await findByTestAttribute('team-invite-emails'), 'new@example.test');
    await user.click(await findByTestAttribute('team-action-confirm'));

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
  });

  it('falls back to asking for another try where a rename is refused without a reason', async () => {
    const user = userEvent.setup();

    server.use(
      http.put(`*/${OrganizationEndpoints.team('*', TEAM.id)}`, () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    await openTeam(user);
    await user.click(await screen.findByText(akMT('editTeamName')));

    await user.type(await screen.findByLabelText(akMT('editTeamNameInputLabel')), ' two');
    await user.click(screen.getByText(akMT('edit')));

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
  });

  it('asks for the next page of each of the team’s lists', async () => {
    const user = userEvent.setup();
    const offsets: string[] = [];

    server.use(
      http.get(`*/${OrganizationEndpoints.teamProjects('*', TEAM.id)}`, ({ request }) => {
        offsets.push(new URL(request.url).searchParams.get('offset') ?? '');

        return HttpResponse.json({
          count: 7,
          next: null,
          previous: null,
          results: [buildOrganizationTeamProject({ id: 99 })],
        });
      })
    );

    await openTeam(user);
    await screen.findByText('com.example.app');

    const projects = await findByTestAttribute('team-project-list');

    await user.click(within(projects).getByRole('button', { name: akMT('next') }));

    await waitFor(() => expect(offsets).toContain('5'));
  });
});
