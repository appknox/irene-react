import { useQuery } from '@tanstack/react-query';

import { formatRelativeTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkPagination } from '@irene/ui/ak-pagination';
import { AkTable } from '@irene/ui/ak-table';
import { createAkTableColumns } from '@irene/ui/ak-table/helpers';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiOrganizationInvitation } from '@irene/api/services/organization';

import { useOrganization } from '@/hooks/use-organization';
import { useUrlState } from '@/hooks/use-url-state';
import { organizationInvitationsOptions } from '@/queries/organization';

import { DeleteInvitation, ResendInvitation } from './invitation-actions';
import { InviteType } from './invite-type';

/* The page sizes irene offers here, rather than the design system's own. */
const PAGE_SIZES = [10, 25, 50];

/* The query parameters irene keeps this list in, beside the members' own. */
const INVITATIONS_URL_STATE = {
  invite_limit: PAGE_SIZES[0],
  invite_offset: 0,
};

const invitationColumn = createAkTableColumns<ApiOrganizationInvitation>();

const INVITATION_COLUMNS = invitationColumn.columns([
  invitationColumn.accessor('email', {
    header: () => akMT('email'),
    meta: { width: '20%' },
    cell: ({ getValue }) => (
      <AkTypography tag="span" noWrap title={getValue()} data-test-invitation-email>
        {getValue()}
      </AkTypography>
    ),
  }),

  invitationColumn.display({
    id: 'invite-type',
    header: () => akMT('inviteType'),
    meta: { width: '20%' },
    cell: ({ row }) => <InviteType teamId={row.original.team} />,
  }),

  invitationColumn.accessor('created_on', {
    header: () => akMT('invitedOn'),
    meta: { width: '20%' },
    cell: ({ getValue }) => (
      <AkTypography tag="span" color="textSecondary" data-test-invitation-sent>
        {formatRelativeTime(getValue())}
      </AkTypography>
    ),
  }),

  invitationColumn.display({
    id: 'resend',
    header: () => akMT('resend'),
    meta: { width: '20%', align: 'center' },
    cell: ({ row }) => <ResendInvitation invitation={row.original} />,
  }),

  invitationColumn.display({
    id: 'delete',
    header: () => akMT('delete'),
    meta: { width: '20%', align: 'center' },
    cell: ({ row }) => <DeleteInvitation invitation={row.original} />,
  }),
]);

/**
 * The invitations the organization is still waiting on.
 *
 * Nothing is drawn where there are none, as irene draws nothing: an empty
 * table under the members would read as a second, broken list.
 */
export function InvitationList() {
  const { selected } = useOrganization();
  const [urlState, changeUrlState] = useUrlState(INVITATIONS_URL_STATE);

  const invitations = useQuery(
    organizationInvitationsOptions(selected?.id, {
      limit: urlState.invite_limit,
      offset: urlState.invite_offset,
    })
  );

  const rows = invitations.data?.items ?? [];
  const totalItems = invitations.data?.count ?? 0;

  /* Nothing is drawn until the invitations are in, as the list has no placeholder of its own. */
  if (invitations.isPending || invitations.isPlaceholderData || totalItems === 0) {
    return null;
  }

  return (
    <div className="mt-7 flex w-full flex-col" data-test-invitations>
      <AkTypography tag="h2" variant="h5" className="my-5.25" data-test-invitations-title>
        {akMT('pendingInvitations')}
      </AkTypography>

      <AkTable
        columns={INVITATION_COLUMNS}
        data={rows}
        caption={akMT('pendingInvitations')}
        getRowId={(invitation) => String(invitation.id)}
        wrapperClassName="bg-background"
        data-test-invitations-table
      />

      <AkPagination
        totalItems={totalItems}
        limit={urlState.invite_limit}
        offset={urlState.invite_offset}
        itemPerPageOptions={PAGE_SIZES}
        tableItemLabel={akMT('invites')}
        perPageLabel={akMT('recordPerPage')}

        onPageChange={({ limit, offset }) =>
          changeUrlState({ invite_limit: limit, invite_offset: offset })
        }

        onItemPerPageChange={({ limit }) =>
          changeUrlState({ invite_limit: limit, invite_offset: 0 })
        }
      />
    </div>
  );
}
