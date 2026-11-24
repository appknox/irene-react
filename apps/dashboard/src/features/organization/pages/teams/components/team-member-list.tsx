import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import type { ApiOrganizationTeam, ApiOrganizationTeamMember } from '@irene/api/services/organization';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkPagination } from '@irene/ui/ak-pagination';
import { AkTable } from '@irene/ui/ak-table';
import { createAkTableColumns } from '@irene/ui/ak-table/helpers';
import { AkTypography } from '@irene/ui/ak-typography';
import OrgUsersEmpty from '@irene/ui/svgs/org-users-empty.svg?react';

import { TableSkeleton } from '@/components/table-skeleton';
import { useOrganization } from '@/hooks/use-organization';
import { organizationTeamMembersOptions, organizationUserOptions } from '@/queries/organization';

import { RemoveTeamMember } from './remove-team-member';

/* The page sizes irene offers inside the drawer, which are smaller than a page's own. */
const PAGE_SIZES = [5, 10, 20];

interface TeamMemberListProps {
  team: ApiOrganizationTeam;
  isAdmin: boolean;
  onAddMembers: () => void;
}

interface TeamMemberNameProps {
  userId: number;
  field: 'username' | 'email';
}

/**
 * One field of the person behind a team member.
 *
 * A team member carries their id alone, so the person is read here, one row at
 * a time, as irene reads them.
 *
 * @param props.userId - The person to read.
 * @param props.field - Which of their fields to show.
 */
function TeamMemberField({ userId, field }: Readonly<TeamMemberNameProps>) {
  const { selected } = useOrganization();
  const { data: user } = useQuery(organizationUserOptions(selected?.id, userId));

  return (
    <AkTypography tag="span" noWrap title={user?.[field]} data-test-team-member-field>
      {user?.[field] ?? ''}
    </AkTypography>
  );
}

const memberColumn = createAkTableColumns<ApiOrganizationTeamMember>();

/**
 * Builds the columns of the team's member table.
 *
 * @param team - The team the members belong to, which removing one needs.
 * @param isAdmin - Whether this account may take a member out of the team.
 * @returns The columns, the action one only for an administrator.
 */
function buildMemberColumns(team: ApiOrganizationTeam, isAdmin: boolean) {
  return memberColumn.columns([
    memberColumn.display({
      id: 'username',
      header: () => akMT('user'),
      cell: ({ row }) => <TeamMemberField userId={row.original.id} field="username" />,
    }),

    memberColumn.display({
      id: 'email',
      header: () => akMT('email'),
      cell: ({ row }) => <TeamMemberField userId={row.original.id} field="email" />,
    }),

    ...(isAdmin
      ? [
          memberColumn.display({
            id: 'action',
            header: () => akMT('action'),
            meta: { align: 'center' as const },
            cell: ({ row }) => <RemoveTeamMember team={team} userId={row.original.id} />,
          }),
        ]
      : []),
  ]);
}

/**
 * The people in one team, a page at a time.
 *
 * @param props.team - The team whose members to list.
 * @param props.isAdmin - Whether this account may add and remove members.
 * @param props.onAddMembers - Opens the pane for adding people to the team.
 */
export function TeamMemberList({ team, isAdmin, onAddMembers }: Readonly<TeamMemberListProps>) {
  const { selected } = useOrganization();
  const [page, setPage] = useState({ limit: PAGE_SIZES[0], offset: 0 });

  const members = useQuery(organizationTeamMembersOptions(selected?.id, team.id, page));

  const rows = members.data?.items ?? [];
  const totalItems = members.data?.count ?? 0;
  const isLoading = members.isPending || members.isPlaceholderData;

  const columns = buildMemberColumns(team, isAdmin);

  return (
    <div className="flex w-full flex-col" data-test-team-member-list>
      <div className="mb-3.5 flex items-center justify-between gap-3.5">
        <div className="flex flex-col gap-1">
          <AkTypography tag="h3" variant="h6" data-test-team-member-list-title>
            {akMT('users')}
          </AkTypography>

          <AkTypography variant="body2" color="textSecondary">
            {akMT('teamUsersDesc')}
          </AkTypography>
        </div>

        {isAdmin && (
          <AkButton onClick={onAddMembers} data-test-team-add-members>
            <AkIcon name="material-symbols:group-add" />

            {akMT('addUser')}
          </AkButton>
        )}
      </div>

      {isLoading && (
        <TableSkeleton columns={columns} rows={3} dense caption={akMT('users')} />
      )}

      {!isLoading && totalItems === 0 && (
        <div
          className="
            flex min-h-37.5 w-full flex-col items-center justify-center gap-3.5 rounded-xs border
            border-border p-5.25
          "
          data-test-team-member-list-empty
        >
          <OrgUsersEmpty aria-hidden="true" className="h-17.5" />

          <AkTypography variant="h6">{akMT('noMembers')}</AkTypography>
        </div>
      )}

      {!isLoading && totalItems > 0 && (
        <AkTable
          columns={columns}
          data={rows}
          dense
          caption={akMT('users')}
          getRowId={(member) => String(member.id)}
          data-test-team-member-list-table
        />
      )}

      {!isLoading && totalItems > 0 && (
        <AkPagination
          totalItems={totalItems}
          limit={page.limit}
          offset={page.offset}
          itemPerPageOptions={PAGE_SIZES}
          variant="compact"
          onPageChange={setPage}
          onItemPerPageChange={({ limit }) => setPage({ limit, offset: 0 })}
          tableItemLabel={akMT('users')}
          perPageLabel={akMT('recordPerPage')}
        />
      )}
    </div>
  );
}
