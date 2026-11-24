import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import type {
  ApiOrganizationInvitation,
  ApiOrganizationTeam,
} from '@irene/api/services/organization';
import { formatRelativeTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkPagination } from '@irene/ui/ak-pagination';
import { AkTable } from '@irene/ui/ak-table';
import { createAkTableColumns } from '@irene/ui/ak-table/helpers';
import { AkTypography } from '@irene/ui/ak-typography';
import OrgInvitationEmpty from '@irene/ui/svgs/org-invitation-empty.svg?react';

import { TableSkeleton } from '@/components/table-skeleton';
import { useOrganization } from '@/hooks/use-organization';
import { organizationTeamInvitationsOptions } from '@/queries/organization';

import {
  DeleteInvitation,
  ResendInvitation,
} from '@/features/organization/pages/users/components/invitation-actions';

/* The page sizes irene offers inside the drawer, which are smaller than a page's own. */
const PAGE_SIZES = [5, 10, 20];

interface TeamInvitationListProps {
  team: ApiOrganizationTeam;
  isAdmin: boolean;
  onInvite: () => void;
}

const invitationColumn = createAkTableColumns<ApiOrganizationInvitation>();

/*
  A team's invitations are the organization's own, read through the team, so
  sending one again and withdrawing it are the same actions as on the users
  screen and are reused from there.
*/
const INVITATION_COLUMNS = invitationColumn.columns([
  invitationColumn.accessor('email', {
    header: () => akMT('email'),
    meta: { width: '40%' },
    cell: ({ getValue }) => (
      <AkTypography tag="span" noWrap title={getValue()} data-test-team-invitation-email>
        {getValue()}
      </AkTypography>
    ),
  }),

  invitationColumn.accessor('created_on', {
    header: () => akMT('invitedOn'),
    meta: { width: '24%' },
    cell: ({ getValue }) => (
      <AkTypography tag="span" color="textSecondary" data-test-team-invitation-sent>
        {formatRelativeTime(getValue())}
      </AkTypography>
    ),
  }),

  invitationColumn.display({
    id: 'resend',
    header: () => akMT('resend'),
    meta: { width: '18%', align: 'center' },
    cell: ({ row }) => <ResendInvitation invitation={row.original} blurOverlay />,
  }),

  invitationColumn.display({
    id: 'delete',
    header: () => akMT('delete'),
    meta: { width: '18%', align: 'center' },
    cell: ({ row }) => <DeleteInvitation invitation={row.original} blurOverlay />,
  }),
]);

/**
 * The invitations one team has open, a page at a time.
 *
 * @param props.team - The team whose invitations to list.
 * @param props.isAdmin - Whether this account may invite people into the team.
 * @param props.onInvite - Opens the pane for inviting someone into the team.
 */
export function TeamInvitationList({
  team,
  isAdmin,
  onInvite,
}: Readonly<TeamInvitationListProps>) {
  const { selected } = useOrganization();
  const [page, setPage] = useState({ limit: PAGE_SIZES[0], offset: 0 });

  const invitations = useQuery(organizationTeamInvitationsOptions(selected?.id, team.id, page));

  const rows = invitations.data?.items ?? [];
  const totalItems = invitations.data?.count ?? 0;
  const isLoading = invitations.isPending || invitations.isPlaceholderData;

  return (
    <div className="flex w-full flex-col" data-test-team-invitations>
      <div className="mb-3.5 flex items-center justify-between gap-3.5">
        <div className="flex flex-col gap-1">
          <AkTypography tag="h3" variant="h6" data-test-team-invitations-title>
            {akMT('teamInvitations')}
          </AkTypography>

          <AkTypography variant="body2" color="textSecondary">
            {akMT('teamInvitationsDesc')}
          </AkTypography>
        </div>

        {isAdmin && (
          <AkButton onClick={onInvite} data-test-team-invite>
            <AkIcon name="material-symbols:group-add" />

            {akMT('inviteUsers')}
          </AkButton>
        )}
      </div>

      {isLoading && (
        <TableSkeleton
          columns={INVITATION_COLUMNS}
          rows={3}
          dense
          caption={akMT('teamInvitations')}
        />
      )}

      {!isLoading && totalItems === 0 && (
        <div
          className="
            flex min-h-37.5 w-full flex-col items-center justify-center gap-3.5 rounded-xs border
            border-border p-5.25
          "
          data-test-team-invitations-empty
        >
          <OrgInvitationEmpty aria-hidden="true" className="h-17.5" />

          <AkTypography variant="h6">{akMT('noInvitations')}</AkTypography>
        </div>
      )}

      {!isLoading && totalItems > 0 && (
        <AkTable
          columns={INVITATION_COLUMNS}
          data={rows}
          dense
          caption={akMT('teamInvitations')}
          getRowId={(invitation) => String(invitation.id)}
          data-test-team-invitations-table
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
          tableItemLabel={akMT('invitations')}
          perPageLabel={akMT('recordPerPage')}
        />
      )}
    </div>
  );
}
