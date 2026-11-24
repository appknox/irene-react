import type { ApiOrganizationMembership } from '@irene/api/services/organization';
import { DateTimeFormat, formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkTypography } from '@irene/ui/ak-typography';
import { createAkTableColumns } from '@irene/ui/ak-table/helpers';

import { MemberIdentity } from './components/member-identity';
import { MemberRole } from './components/member-role';

const memberColumn = createAkTableColumns<ApiOrganizationMembership>();

/**
 * Builds the four columns irene shows: who they are, their address, role and
 * last visit.
 *
 * The role column is centred for an owner alone, since only they are given the
 * control that sits in it.
 *
 * @param isOwner - Whether the account reading the table owns the organization.
 * @returns The columns, ready for `AkTable`.
 */
export const buildMemberColumns = (isOwner: boolean) =>
  memberColumn.columns([
    memberColumn.display({
      id: 'user',
      header: () => akMT('user'),
      meta: { width: '30%' },
      cell: ({ row }) => (
        <MemberIdentity
          userId={row.original.member}
          field="username"
          isActive={row.original.is_active}
        />
      ),
    }),

    memberColumn.display({
      id: 'email',
      header: () => akMT('email'),
      meta: { width: '30%' },
      cell: ({ row }) => <MemberIdentity userId={row.original.member} field="email" />,
    }),

    memberColumn.display({
      id: 'role',
      header: () => akMT('role'),
      meta: { width: '20%', align: isOwner ? 'center' : 'left' },
      cell: ({ row }) => <MemberRole member={row.original} />,
    }),

    memberColumn.accessor('last_logged_in', {
      header: () => akMT('lastLoggedIn'),
      meta: { width: '20%', align: 'center' },

      /* irene dates this rather than counting back from now, and says so when there is none. */
      cell: ({ getValue }) => (
        <AkTypography tag="span" noWrap data-test-member-last-login>
          {getValue() ? formatDateTime(getValue(), DateTimeFormat.ll) : akMT('never')}
        </AkTypography>
      ),
    }),
  ]);
