import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Fragment } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { OrganizationEndpoints } from '@irene/api/services/organization/endpoints';
import { organizationStore } from '@irene/api/stores/organization';
import { clearStoredSession, storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';
import { AkToaster } from '@irene/ui/ak-toaster';

import {
  buildOrganization,
  buildOrganizationMe,
  buildOrganizationMembership,
  buildOrganizationTeam,
  buildOrganizationUser,
  buildSession,
} from '@tests/factories';
import { renderAtAddress } from '@tests/render';
import { server } from '@tests/server';

import { OrganizationUsersPage } from '../index';

const MEMBERSHIP = buildOrganizationMembership({
  member: 7,
  role: ENUMS.ORGANIZATION_ROLES.MEMBER,
});

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

/** Puts this account in the organization with the standing given. */
const inOrganizationAs = (standing: { is_admin: boolean; is_owner?: boolean }) =>
  organizationStore
    .getState()
    .select(buildOrganization(), buildOrganizationMe({ is_owner: false, ...standing }));

/** Answers everything the users screen and the drawer read. */
const withMemberRecords = ({ isActive = true, teams = [TEAM] } = {}) =>
  server.use(
    http.get(`*/${OrganizationEndpoints.members('*')}`, () =>
      HttpResponse.json({ count: 1, next: null, previous: null, results: [MEMBERSHIP] })
    ),

    http.get(`*/${OrganizationEndpoints.invitations('*')}`, () =>
      HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
    ),

    http.get('*/api/organizations/:organizationId/users/:userId', () =>
      HttpResponse.json(
        buildOrganizationUser({
          id: MEMBERSHIP.member,
          username: 'alice',
          email: 'alice@example.test',
          is_active: isActive,
        })
      )
    ),

    http.get(`*/${OrganizationEndpoints.teams('*')}`, () =>
      HttpResponse.json({ count: teams.length, next: null, previous: null, results: teams })
    )
  );

/** Opens the drawer the way a user does: by pressing the member's row. */
const openMember = async (user: ReturnType<typeof userEvent.setup>) => {
  renderAtAddress(
    <Fragment>
      <OrganizationUsersPage />

      <AkToaster />
    </Fragment>,
    '/dashboard/organization/users'
  );

  await user.click(await screen.findByText('alice@example.test'));
};

describe('the member drawer', () => {
  beforeEach(() => {
    clearStoredSession();
    storeSession(buildSession());
    inOrganizationAs({ is_admin: true, is_owner: true });
    withMemberRecords();
  });

  it('opens on the member behind the row, with who they are', async () => {
    const user = userEvent.setup();

    await openMember(user);

    expect(await screen.findByText(akMT('userDetails'))).toBeInTheDocument();
    expect(await findByTestAttribute('member-username')).toHaveTextContent('alice');
    expect(await findByTestAttribute('member-email')).toHaveTextContent('alice@example.test');
  });

  it('lists the teams the member is in', async () => {
    const user = userEvent.setup();

    await openMember(user);

    expect(await findByTestAttribute('member-team-list-table')).toBeInTheDocument();
    expect(await screen.findByText(TEAM.name)).toBeInTheDocument();
  });

  it('says the member is in none where they are in none', async () => {
    const user = userEvent.setup();

    withMemberRecords({ teams: [] });

    await openMember(user);

    expect(await findByTestAttribute('member-team-list-empty')).toBeInTheDocument();
  });

  it('asks the teams endpoint for the teams this member is in', async () => {
    const user = userEvent.setup();
    let asked = new URLSearchParams();

    server.use(
      http.get(`*/${OrganizationEndpoints.teams('*')}`, ({ request }) => {
        asked = new URL(request.url).searchParams;

        return HttpResponse.json({ count: 1, next: null, previous: null, results: [TEAM] });
      })
    );

    await openMember(user);
    await screen.findByText(TEAM.name);

    expect(asked.get('include_user')).toBe(String(MEMBERSHIP.member));
  });

  it('takes the member out of a team once the question is answered', async () => {
    const user = userEvent.setup();
    let removedFrom = '';

    server.use(
      http.delete(
        '*/api/organizations/:organizationId/teams/:teamId/members/:userId',
        ({ params }) => {
          removedFrom = String(params.teamId);

          return HttpResponse.json({});
        }
      )
    );

    await openMember(user);
    await user.click(await findByTestAttribute('member-team-remove'));

    await user.click(
      within(await findByTestAttribute('confirm-box')).getByText(akMT('remove'))
    );

    await waitFor(() => expect(removedFrom).toBe(String(TEAM.id)));
  });

  it('offers the teams the member is not in behind the control to add them', async () => {
    const user = userEvent.setup();
    const asked: Array<string | null> = [];

    server.use(
      http.get(`*/${OrganizationEndpoints.teams('*')}`, ({ request }) => {
        asked.push(new URL(request.url).searchParams.get('exclude_user'));

        return HttpResponse.json({ count: 1, next: null, previous: null, results: [TEAM] });
      })
    );

    await openMember(user);
    await user.click(await findByTestAttribute('member-add-to-teams'));

    /* The drawer's own bar says what the view is, and the list under it says what it offers. */
    expect(await findByTestAttribute('member-team-list-title')).toHaveTextContent(
      akMT('addToTeams')
    );

    await waitFor(() => expect(asked).toContain(String(MEMBERSHIP.member)));
  });

  it('puts the member in a team from that view', async () => {
    const user = userEvent.setup();
    let addedTo = '';

    server.use(
      http.put('*/api/organizations/:organizationId/teams/:teamId/members/:userId', ({ params }) => {
        addedTo = String(params.teamId);

        return HttpResponse.json({});
      })
    );

    await openMember(user);
    await user.click(await findByTestAttribute('member-add-to-teams'));

    await user.click(await findByTestAttribute('member-team-add'));

    await waitFor(() => expect(addedTo).toBe(String(TEAM.id)));
  });

  it('returns to the member from that view', async () => {
    const user = userEvent.setup();

    await openMember(user);
    await user.click(await findByTestAttribute('member-add-to-teams'));

    await user.click(await findByTestAttribute('member-add-to-teams-title'));

    expect(await findByTestAttribute('member-username')).toHaveTextContent('alice');
  });

  it('keeps a deactivated member from being added to a team', async () => {
    const user = userEvent.setup();

    withMemberRecords({ isActive: false });

    await openMember(user);

    expect(await findByTestAttribute('member-add-to-teams')).toBeDisabled();
  });

  it('deactivates the member once the question is answered', async () => {
    const user = userEvent.setup();
    let sentActive: boolean | null = null;

    server.use(
      http.put('*/api/organizations/:organizationId/users/:userId', async ({ request }) => {
        sentActive = ((await request.json()) as { is_active: boolean }).is_active;

        return HttpResponse.json(buildOrganizationUser({ is_active: false }));
      })
    );

    await openMember(user);
    await user.click(await findByTestAttribute('change-activity-status-button'));

    await user.click(
      within(await findByTestAttribute('confirm-box')).getByText(akMT('confirm'))
    );

    await waitFor(() => expect(sentActive).toBe(false));
  });

  it('offers to bring a deactivated member back', async () => {
    const user = userEvent.setup();

    withMemberRecords({ isActive: false });

    await openMember(user);

    expect(await findByTestAttribute('change-activity-status-button')).toHaveTextContent(
      akMT('activateUser')
    );
  });

  it('says what went wrong when the standing cannot be changed', async () => {
    const user = userEvent.setup();

    server.use(
      http.put('*/api/organizations/:organizationId/users/:userId', () =>
        HttpResponse.json({ detail: 'Not permitted' }, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    await openMember(user);
    await user.click(await findByTestAttribute('change-activity-status-button'));

    await user.click(
      within(await findByTestAttribute('confirm-box')).getByText(akMT('confirm'))
    );

    expect(await screen.findByText('Not permitted')).toBeInTheDocument();
  });

  it('keeps the way to deactivate from anyone who is not an owner', async () => {
    const user = userEvent.setup();

    inOrganizationAs({ is_admin: true, is_owner: false });

    await openMember(user);
    await findByTestAttribute('member-username');

    expect(document.querySelector('[data-test-change-activity-status]')).not.toBeInTheDocument();
  });

  it('leaves the member closed when the role beside them is what was acted on', async () => {
    const user = userEvent.setup();

    await openMember(user);
    await user.click(await screen.findByLabelText(akMT('close')));

    await waitFor(() =>
      expect(screen.queryByText(akMT('userDetails'))).not.toBeInTheDocument()
    );

    await user.click(screen.getByRole('combobox', { name: akMT('role') }));

    expect(screen.queryByText(akMT('userDetails'))).not.toBeInTheDocument();
  });
});
