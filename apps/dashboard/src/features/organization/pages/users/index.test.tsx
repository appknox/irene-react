import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Fragment } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { OrganizationEndpoints } from '@irene/api/services/organization/endpoints';
import { clearStoredSession, storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';
import { AkToaster } from '@irene/ui/ak-toaster';

import { organizationStore } from '@irene/api/stores/organization';

import {
  buildOrganization,
  buildOrganizationMe,
  buildOrganizationInvitation,
  buildOrganizationMembership,
  buildOrganizationTeam,
  buildOrganizationUser,
  buildSession,
} from '@tests/factories';
import { renderAtAddress } from '@tests/render';
import { server } from '@tests/server';

import { OrganizationUsersPage } from './index';

let lastParams: URLSearchParams;

/** Answers the members list with these rows, recording what was asked for. */
const withMembers = (
  members: ReturnType<typeof buildOrganizationMembership>[],
  count = members.length
) =>
  server.use(
    http.get(`*/${OrganizationEndpoints.members('*')}`, ({ request }) => {
      lastParams = new URL(request.url).searchParams;

      return HttpResponse.json({ count, next: null, previous: null, results: members });
    })
  );

/* The pane reads the organization from the store the signed-in routes fill. */
const inOrganizationAs = (standing: { is_admin: boolean; is_owner?: boolean }) =>
  organizationStore
    .getState()
    .select(buildOrganization(), buildOrganizationMe({ is_owner: false, ...standing }));

/** Answers the lookup each row makes for the member behind its id. */
const withUser = (username: string, email: string) =>
  server.use(
    http.get('*/api/organizations/:organizationId/users/:userId', () =>
      HttpResponse.json(buildOrganizationUser({ username, email }))
    )
  );

describe('OrganizationUsersPage', () => {
  beforeEach(() => {
    clearStoredSession();
    storeSession(buildSession());
    withUser('alice', 'alice@example.test');
    inOrganizationAs({ is_admin: true });
  });

  it('lists a member by name, address and role', async () => {
    withMembers([buildOrganizationMembership({ role: ENUMS.ORGANIZATION_ROLES.ADMIN })]);

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    expect(await screen.findByText('alice')).toBeInTheDocument();
    expect(screen.getByText('alice@example.test')).toBeInTheDocument();
    expect(screen.getByText(akMT('admin'))).toBeInTheDocument();
  });

  /*
    The pane is rendered before the organization is, and a list that has not
    been asked for yet is not a list with nothing in it.
  */
  it('draws placeholder rows until the account and its organization are known', async () => {
    organizationStore.getState().clear();
    withMembers([]);

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    await waitFor(() =>
      expect(document.querySelector('[data-test-table-skeleton]')).toBeInTheDocument()
    );

    expect(screen.queryByText(akMT('noMembers'))).not.toBeInTheDocument();
  });

  it('replaces the placeholder rows with the members once they arrive', async () => {
    withMembers([buildOrganizationMembership()]);

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    await waitFor(() =>
      expect(document.querySelector('[data-test-table-skeleton]')).toBeInTheDocument()
    );

    expect(await screen.findByText('alice')).toBeInTheDocument();
    expect(document.querySelector('[data-test-table-skeleton]')).not.toBeInTheDocument();
  });

  it('says there are no members where the organization has none', async () => {
    withMembers([]);

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    expect(await screen.findByText(akMT('noMembers'))).toBeInTheDocument();
  });

  it('reloads the list when the label beside the box is clicked', async () => {
    const user = userEvent.setup();

    withMembers([buildOrganizationMembership()]);

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');
    await screen.findByText('alice');

    expect(lastParams.get('is_active')).toBe('true');

    await user.click(screen.getByText(akMT('includeInactiveMembers')));

    await waitFor(() => expect(lastParams.get('is_active')).toBeNull());
  });

  it('brings the deactivated members in and out of the list', async () => {
    const user = userEvent.setup();

    const active = buildOrganizationMembership({ member: 1 });
    const deactivated = buildOrganizationMembership({ member: 2, is_active: false });

    /* The server answers with whoever the filter asks for, so the rows are what is under test. */
    server.use(
      http.get(`*/${OrganizationEndpoints.members('*')}`, ({ request }) => {
        const wantsActiveOnly = new URL(request.url).searchParams.get('is_active') === 'true';
        const results = wantsActiveOnly ? [active] : [active, deactivated];

        return HttpResponse.json({
          count: results.length,
          next: null,
          previous: null,
          results,
        });
      })
    );

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    await screen.findByRole('table');

    expect(screen.queryByText(akMT('chipStatus.inactive'))).not.toBeInTheDocument();

    const box = screen.getByRole('checkbox', { name: akMT('includeInactiveMembers') });

    await user.click(box);

    expect(await screen.findByText(akMT('chipStatus.inactive'))).toBeInTheDocument();

    await user.click(box);

    await waitFor(() =>
      expect(screen.queryByText(akMT('chipStatus.inactive'))).not.toBeInTheDocument()
    );
  });

  it('opens at the page and search the address names', async () => {
    withMembers([buildOrganizationMembership()]);

    renderAtAddress(
      <OrganizationUsersPage />,
      '/dashboard/organization/users?user_limit=25&user_offset=50&user_query=ali'
    );

    await screen.findByRole('table');

    expect(lastParams.get('limit')).toBe('25');
    expect(lastParams.get('offset')).toBe('50');
    expect(lastParams.get('q')).toBe('ali');
  });

  it('keeps what was searched for in the address', async () => {
    const user = userEvent.setup();

    withMembers([buildOrganizationMembership()]);

    const { router } = renderAtAddress(
      <OrganizationUsersPage />,
      '/dashboard/organization/users'
    );

    await screen.findByRole('table');

    await user.type(screen.getByRole('textbox', { name: akMT('searchUser') }), 'ali');

    await waitFor(() => expect(router.state.location.search).toMatchObject({ user_query: 'ali' }));
  });

  it('leaves deactivated members out until they are asked for', async () => {
    const user = userEvent.setup();

    withMembers([buildOrganizationMembership()]);

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');
    await screen.findByText('alice');

    expect(lastParams.get('is_active')).toBe('true');

    await user.click(screen.getByRole('checkbox', { name: akMT('includeInactiveMembers') }));

    await waitFor(() => expect(lastParams.get('is_active')).toBeNull());
  });

  it('searches the members by what is typed', async () => {
    const user = userEvent.setup();

    withMembers([buildOrganizationMembership()]);

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');
    await screen.findByText('alice');

    await user.type(screen.getByRole('textbox', { name: akMT('searchUser') }), 'ali');

    await waitFor(() => expect(lastParams.get('q')).toBe('ali'));
  });

  it('shows nothing to an account that does not administer the organization', async () => {
    inOrganizationAs({ is_admin: false });
    withMembers([buildOrganizationMembership()]);

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    await waitFor(() => expect(screen.queryByText('alice')).not.toBeInTheDocument());
  });

  it('offers an owner the way to invite people', async () => {
    inOrganizationAs({ is_admin: true, is_owner: true });
    withMembers([]);

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    expect(
      await screen.findByRole('button', { name: new RegExp(akMT('inviteUsers')) })
    ).toBeInTheDocument();
  });

  it('withholds it from an administrator who does not own the organization', async () => {
    withMembers([]);

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    await screen.findByText(akMT('noMembers'));

    expect(
      screen.queryByRole('button', { name: new RegExp(akMT('inviteUsers')) })
    ).not.toBeInTheDocument();
  });

  it('reads several addresses from one field, and drops one on request', async () => {
    const user = userEvent.setup();

    inOrganizationAs({ is_admin: true, is_owner: true });
    withMembers([]);

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    await user.click(await screen.findByRole('button', { name: new RegExp(akMT('inviteUsers')) }));

    const drawer = await screen.findByRole('dialog');

    await user.type(within(drawer).getByRole('textbox'), 'a@b.test, c@d.test');

    expect(await within(drawer).findByText('a@b.test')).toBeInTheDocument();
    expect(within(drawer).getByText('c@d.test')).toBeInTheDocument();
  });

  it('sends an invitation to each address given', async () => {
    const user = userEvent.setup();
    const invited: string[] = [];

    inOrganizationAs({ is_admin: true, is_owner: true });
    withMembers([]);

    server.use(
      http.post(`*/${OrganizationEndpoints.invitations('*')}`, async ({ request }) => {
        invited.push(((await request.json()) as { email: string }).email);

        return HttpResponse.json({});
      })
    );

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    await user.click(await screen.findByRole('button', { name: new RegExp(akMT('inviteUsers')) }));

    const drawer = await screen.findByRole('dialog');

    await user.type(within(drawer).getByRole('textbox'), 'a@b.test, c@d.test');
    await user.click(within(drawer).getByRole('button', { name: akMT('invite') }));

    await waitFor(() => expect(invited).toEqual(['a@b.test', 'c@d.test']));
  });

  it('refuses to send with no address given', async () => {
    const user = userEvent.setup();
    let asked = false;

    inOrganizationAs({ is_admin: true, is_owner: true });
    withMembers([]);

    server.use(
      http.post(`*/${OrganizationEndpoints.invitations('*')}`, () => {
        asked = true;

        return HttpResponse.json({});
      })
    );

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    await user.click(await screen.findByRole('button', { name: new RegExp(akMT('inviteUsers')) }));

    const drawer = await screen.findByRole('dialog');

    await user.click(within(drawer).getByRole('button', { name: akMT('invite') }));

    expect(asked).toBe(false);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('says under the field that an address cannot be sent to', async () => {
    const user = userEvent.setup();
    let asked = false;

    inOrganizationAs({ is_admin: true, is_owner: true });
    withMembers([]);

    server.use(
      http.post(`*/${OrganizationEndpoints.invitations('*')}`, () => {
        asked = true;

        return HttpResponse.json({});
      })
    );

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    await user.click(await screen.findByRole('button', { name: new RegExp(akMT('inviteUsers')) }));

    const drawer = await screen.findByRole('dialog');

    await user.type(within(drawer).getByRole('textbox'), 'not-an-address');
    await user.click(within(drawer).getByRole('button', { name: akMT('invite') }));

    expect(await within(drawer).findByText(akMT('emptyEmailId'))).toBeInTheDocument();
    expect(asked).toBe(false);
  });

  it('sends only the addresses that can be sent to', async () => {
    const user = userEvent.setup();
    const invited: string[] = [];

    inOrganizationAs({ is_admin: true, is_owner: true });
    withMembers([]);

    server.use(
      http.post(`*/${OrganizationEndpoints.invitations('*')}`, async ({ request }) => {
        invited.push(((await request.json()) as { email: string }).email);

        return HttpResponse.json({});
      })
    );

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    await user.click(await screen.findByRole('button', { name: new RegExp(akMT('inviteUsers')) }));

    const drawer = await screen.findByRole('dialog');

    await user.type(within(drawer).getByRole('textbox'), 'a@b.test, broken, c@d.test');
    await user.click(within(drawer).getByRole('button', { name: akMT('invite') }));

    await waitFor(() => expect(invited).toEqual(['a@b.test', 'c@d.test']));
  });

  it('keeps the drawer open when an invitation is refused', async () => {
    const user = userEvent.setup();

    inOrganizationAs({ is_admin: true, is_owner: true });
    withMembers([]);

    server.use(
      http.post(`*/${OrganizationEndpoints.invitations('*')}`, () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    await user.click(await screen.findByRole('button', { name: new RegExp(akMT('inviteUsers')) }));

    const drawer = await screen.findByRole('dialog');

    await user.type(within(drawer).getByRole('textbox'), 'a@b.test');
    await user.click(within(drawer).getByRole('button', { name: akMT('invite') }));

    await waitFor(() =>
      expect(within(drawer).getByRole('textbox')).toHaveValue('a@b.test')
    );
  });

  it('centres the role column for an owner, who is given the control in it', async () => {
    inOrganizationAs({ is_admin: true, is_owner: true });
    withMembers([buildOrganizationMembership()]);

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    expect(await screen.findByRole('columnheader', { name: akMT('role') })).toHaveClass(
      'text-center'
    );
  });

  it('leaves the role column to the left for anyone who only reads it', async () => {
    inOrganizationAs({ is_admin: true, is_owner: false });
    withMembers([buildOrganizationMembership()]);

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    expect(await screen.findByRole('columnheader', { name: akMT('role') })).not.toHaveClass(
      'text-center'
    );
  });

  it('names the role as irene names it, rather than as the server words it', async () => {
    withMembers([buildOrganizationMembership({ role: ENUMS.ORGANIZATION_ROLES.ADMIN })]);

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    expect(await screen.findByText(akMT('admin'))).toBeInTheDocument();
  });

  it('marks a member the organization has deactivated', async () => {
    withMembers([buildOrganizationMembership({ is_active: false })]);

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    expect(await screen.findByText(akMT('chipStatus.inactive'))).toBeInTheDocument();
  });

  it('dates the last visit rather than counting back from now', async () => {
    withMembers([buildOrganizationMembership({ last_logged_in: '2026-04-03T10:00:00Z' })]);

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    expect(await screen.findByText('Apr 3, 2026')).toBeInTheDocument();
  });

  it('says so where a member has never visited', async () => {
    withMembers([buildOrganizationMembership({ last_logged_in: null })]);

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    expect(await screen.findByText(akMT('never'))).toBeInTheDocument();
  });

  it('lets an owner change what a member may do', async () => {
    const user = userEvent.setup();
    let sentRole: number | undefined;

    inOrganizationAs({ is_admin: true, is_owner: true });
    withMembers([buildOrganizationMembership({ role: ENUMS.ORGANIZATION_ROLES.MEMBER })]);

    server.use(
      http.put('*/api/organizations/:organizationId/members/:userId', async ({ request }) => {
        sentRole = ((await request.json()) as { role: number }).role;

        return HttpResponse.json({});
      })
    );

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    await user.click(await screen.findByRole('combobox', { name: akMT('role') }));
    await user.click(screen.getByRole('option', { name: akMT('admin') }));

    await waitFor(() => expect(sentRole).toBe(ENUMS.ORGANIZATION_ROLES.ADMIN));
  });

  it('shows the role as text to anyone who may not change it', async () => {
    withMembers([buildOrganizationMembership({ role: ENUMS.ORGANIZATION_ROLES.MEMBER })]);

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    expect(await screen.findByText(akMT('memberRole'))).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: akMT('role') })).not.toBeInTheDocument();
  });

  it('leaves a deactivated member\'s role alone', async () => {
    inOrganizationAs({ is_admin: true, is_owner: true });
    withMembers([buildOrganizationMembership({ is_active: false })]);

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    expect(await screen.findByRole('combobox', { name: akMT('role') })).toBeDisabled();
  });

  it('falls back to the server wording for a role it does not know', async () => {
    withMembers([buildOrganizationMembership({ role: 99, role_display: 'Auditor' })]);

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    expect(await screen.findByText('Auditor')).toBeInTheDocument();
  });

  it('leaves the role as it was when the change is refused', async () => {
    const user = userEvent.setup();

    inOrganizationAs({ is_admin: true, is_owner: true });
    withMembers([buildOrganizationMembership({ role: ENUMS.ORGANIZATION_ROLES.MEMBER })]);

    server.use(
      http.put('*/api/organizations/:organizationId/members/:userId', () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    await user.click(await screen.findByRole('combobox', { name: akMT('role') }));
    await user.click(screen.getByRole('option', { name: akMT('admin') }));

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: akMT('role') })).toHaveTextContent(
        akMT('memberRole')
      )
    );
  });

  it('pages through the members', async () => {
    withMembers([buildOrganizationMembership()], 42);

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    expect(await screen.findByText(/of 42/)).toBeInTheDocument();
  });
});

describe('the invitations the organization is waiting on', () => {
  /** Answers the invitations list with these rows. */
  const withInvitations = (rows: ReturnType<typeof buildOrganizationInvitation>[]) =>
    server.use(
      http.get(`*/${OrganizationEndpoints.invitations('*')}`, () =>
        HttpResponse.json({ count: rows.length, next: null, previous: null, results: rows })
      )
    );

  beforeEach(() => {
    clearStoredSession();
    storeSession(buildSession());
    withUser('alice', 'alice@example.test');
    inOrganizationAs({ is_admin: true });
    withMembers([buildOrganizationMembership()]);
  });

  it('lists an invitation by address and when it went out', async () => {
    withInvitations([buildOrganizationInvitation({ email: 'new@example.test' })]);

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    expect(
      await screen.findByRole('heading', { name: akMT('pendingInvitations') })
    ).toBeInTheDocument();

    expect(screen.getByText('new@example.test')).toBeInTheDocument();
  });

  it('says an invitation into the organization is just that', async () => {
    withInvitations([buildOrganizationInvitation({ team: null })]);

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    const invitations = await screen.findByRole('table', { name: akMT('pendingInvitations') });

    expect(within(invitations).getByText(akMT('organization'))).toBeInTheDocument();
  });

  it('names and links the team an invitation is into', async () => {
    withInvitations([buildOrganizationInvitation({ team: 7 })]);

    server.use(
      http.get(`*/${OrganizationEndpoints.team('*', 7)}`, () =>
        HttpResponse.json(buildOrganizationTeam({ id: 7, name: 'Platform' }))
      )
    );

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    const link = await screen.findByRole('link', { name: 'Platform' });

    /* The search carries the team searched for, and the list opens at its first page. */
    expect(link).toHaveAttribute(
      'href',
      '/dashboard/organization/teams?team_query=Platform&team_offset=0'
    );
  });

  it('says an invitation is into a team while the team is being read', async () => {
    withInvitations([buildOrganizationInvitation({ team: 7 })]);

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    const invitations = await screen.findByRole('table', { name: akMT('pendingInvitations') });

    expect(within(invitations).getByText(akMT('team'))).toBeInTheDocument();
  });

  it('draws nothing where the organization is waiting on none', async () => {
    withInvitations([]);

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    await screen.findByRole('table');

    expect(
      screen.queryByRole('heading', { name: akMT('pendingInvitations') })
    ).not.toBeInTheDocument();
  });

  it('asks before sending one again', async () => {
    const user = userEvent.setup();
    const invitation = buildOrganizationInvitation({ email: 'new@example.test' });

    withInvitations([invitation]);

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    await user.click(
      await screen.findByRole('button', { name: `${akMT('resendInvitation')} new@example.test` })
    );

    expect(await screen.findByText(akMT('confirmBox.resendInvitation'))).toBeInTheDocument();
  });

  it('sends one again once confirmed', async () => {
    const user = userEvent.setup();
    let resent = false;

    withInvitations([buildOrganizationInvitation({ email: 'new@example.test' })]);

    server.use(
      http.post('*/api/organizations/:organizationId/invitations/:invitationId/resend', () => {
        resent = true;

        return HttpResponse.json({});
      })
    );

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    await user.click(
      await screen.findByRole('button', { name: `${akMT('resendInvitation')} new@example.test` })
    );

    const dialog = await screen.findByRole('dialog');

    await user.click(within(dialog).getByRole('button', { name: akMT('resend') }));

    await waitFor(() => expect(resent).toBe(true));
  });

  it('leaves an invitation alone when the question is dismissed', async () => {
    const user = userEvent.setup();

    withInvitations([buildOrganizationInvitation({ email: 'new@example.test' })]);

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    await user.click(
      await screen.findByRole('button', { name: `${akMT('resendInvitation')} new@example.test` })
    );

    const dialog = await screen.findByRole('dialog');

    await user.click(within(dialog).getByRole('button', { name: akMT('cancel') }));

    await waitFor(() =>
      expect(screen.queryByText(akMT('confirmBox.resendInvitation'))).not.toBeInTheDocument()
    );
  });

  it('says what went wrong when sending one again is refused', async () => {
    const user = userEvent.setup();

    withInvitations([buildOrganizationInvitation({ email: 'new@example.test' })]);

    server.use(
      http.post('*/api/organizations/:organizationId/invitations/:invitationId/resend', () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    renderAtAddress(<Fragment>
        <OrganizationUsersPage />

        <AkToaster />
      </Fragment>
    );

    await user.click(
      await screen.findByRole('button', { name: `${akMT('resendInvitation')} new@example.test` })
    );

    const dialog = await screen.findByRole('dialog');

    await user.click(within(dialog).getByRole('button', { name: akMT('resend') }));

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
  });

  it('says what went wrong when withdrawing one is refused', async () => {
    const user = userEvent.setup();

    withInvitations([buildOrganizationInvitation({ email: 'new@example.test' })]);

    server.use(
      http.delete('*/api/organizations/:organizationId/invitations/:invitationId', () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    renderAtAddress(<Fragment>
        <OrganizationUsersPage />

        <AkToaster />
      </Fragment>
    );

    await user.click(
      await screen.findByRole('button', { name: `${akMT('deleteInvitation')} new@example.test` })
    );

    const dialog = await screen.findByRole('dialog');

    await user.click(within(dialog).getByRole('button', { name: akMT('delete') }));

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
  });

  it('withdraws one once confirmed', async () => {
    const user = userEvent.setup();
    let withdrawn = false;

    withInvitations([buildOrganizationInvitation({ email: 'new@example.test' })]);

    server.use(
      http.delete('*/api/organizations/:organizationId/invitations/:invitationId', () => {
        withdrawn = true;

        return HttpResponse.json({});
      })
    );

    renderAtAddress(<OrganizationUsersPage />, '/dashboard/organization/users');

    await user.click(
      await screen.findByRole('button', { name: `${akMT('deleteInvitation')} new@example.test` })
    );

    const dialog = await screen.findByRole('dialog');

    await user.click(within(dialog).getByRole('button', { name: akMT('delete') }));

    await waitFor(() => expect(withdrawn).toBe(true));
  });
});
