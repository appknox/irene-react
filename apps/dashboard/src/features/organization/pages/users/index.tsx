import { useQuery } from '@tanstack/react-query';
import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';

import type { ApiOrganizationMembership } from '@irene/api/services/organization';
import { akMT } from '@irene/translations/intl';
import { AkCheckbox } from '@irene/ui/ak-checkbox';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkInput } from '@irene/ui/ak-input';
import { AkPagination } from '@irene/ui/ak-pagination';
import { AkTable } from '@irene/ui/ak-table';
import { AkTypography } from '@irene/ui/ak-typography';
import OrgUsersEmpty from '@irene/ui/svgs/org-users-empty.svg?react';

import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { TableSkeleton } from '@/components/table-skeleton';
import { useOrganization } from '@/hooks/use-organization';
import { useUrlState } from '@/hooks/use-url-state';
import { organizationMembersOptions } from '@/queries/organization';

import { buildMemberColumns } from './columns';
import { InvitationList } from './components/invitation-list';
import { MemberDrawer } from './components/member-drawer';
import { InviteUsers } from './components/invite-users';

/* The page sizes irene offers here, rather than the design system's own. */
const PAGE_SIZES = [10, 25, 50];

/* How long typing holds still before the list is asked for, as irene waits. */
const SEARCH_DEBOUNCE_MS = 500;

/* The query parameters irene keeps this list in, so a link to one still works. */
const MEMBERS_URL_STATE = {
  user_limit: PAGE_SIZES[0],
  user_offset: 0,
  user_query: '',
  show_inactive_user: false,
};

/**
 * Everyone in the organization, and how to find them.
 *
 * Deactivated members are left out until asked for, as irene leaves them out
 * until the box beside the search is ticked.
 */
export function OrganizationUsersPage() {
  const { selected, me } = useOrganization();

  const [urlState, changeUrlState] = useUrlState(MEMBERS_URL_STATE);

  /* Which member's details are open. The membership itself, so the drawer opens on what the row shows. */
  const [openedMember, setOpenedMember] = useState<ApiOrganizationMembership | null>(null);

  /* What is in the field now; the list follows once the typing settles. */
  const [searchText, setSearchText] = useState(urlState.user_query);
  const settledSearch = useDebouncedValue(searchText, SEARCH_DEBOUNCE_MS);

  const columns = useMemo(() => buildMemberColumns(Boolean(me?.is_owner)), [me?.is_owner]);

  const members = useQuery(
    organizationMembersOptions(selected?.id, {
      limit: urlState.user_limit,
      offset: urlState.user_offset,
      query: urlState.user_query,
      includeInactive: urlState.show_inactive_user,
    })
  );

  /* A narrowed list is a different list, so it starts at its own first page. */
  useEffect(() => {
    if (settledSearch !== urlState.user_query) {
      changeUrlState({ user_query: settledSearch, user_offset: 0 });
    }
  }, [settledSearch, urlState.user_query, changeUrlState]);

  /* Only an administrator manages members, and whether this account is one is not yet known. */
  if (me !== null && !me.is_admin) {
    return null;
  }

  const rows = members.data?.items ?? [];
  const totalItems = members.data?.count ?? 0;

  /*
    Drawn before the first answer and while another page or search is being
    read, where the rows on screen are the ones asked for last. A refresh of
    the page already shown keeps its rows, so acting on a member does not empty
    the table around them. Until there is an organization the query has not
    started, which is not the same as a list with nothing in it.
  */
  const isLoadingMembers = me === null || members.isPending || members.isPlaceholderData;

  /*
    A row opens the member, except where the role was the thing acted on: that
    control sits in a row of its own and deciding a role is not asking to see
    the member, as irene also keeps them apart.
  */
  const openMember = (
    member: ApiOrganizationMembership,
    event: MouseEvent<HTMLTableRowElement> | KeyboardEvent<HTMLTableRowElement>
  ) => {
    const target = event.target;

    if (target instanceof Element && target.closest('[data-test-member-role-select]')) {
      return;
    }

    setOpenedMember(member);
  };

  return (
    <div className="flex w-full flex-col" data-test-organization-users>
      <div className="flex w-full items-center gap-3.5 py-5.25">
        <div className="relative w-75 bg-background">
          <AkIcon
            name="material-symbols:search"
            size="1.25rem"
            className="absolute top-1/2 left-2.5 -translate-y-1/2 text-foreground-muted"
            aria-hidden
          />

          <AkInput
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder={akMT('searchUser')}
            aria-label={akMT('searchUser')}
            className="pl-8.5"
            data-test-user-search
          />
        </div>

        {/*
          Tied by id rather than wrapped: the control is a button, which a label
          activates in its own right, so a click inside one would toggle twice
          and leave the list as it was.
        */}
        <div className="ml-auto flex items-center gap-1.75">
          <AkCheckbox
            id="include-inactive-members"
            checked={urlState.show_inactive_user}
            onCheckedChange={(checked) =>
              changeUrlState({ show_inactive_user: checked === true, user_offset: 0 })
            }
            data-test-include-inactive
          />

          <label htmlFor="include-inactive-members">
            <AkTypography tag="span">{akMT('includeInactiveMembers')}</AkTypography>
          </label>
        </div>

        {me?.is_owner && <InviteUsers />}
      </div>

      {isLoadingMembers && (
        <TableSkeleton
          columns={columns}
          caption={akMT('users')}
          wrapperClassName="bg-background"
        />
      )}

      {!isLoadingMembers && totalItems === 0 && (
        <div
          className="flex h-75 w-full flex-col items-center justify-center gap-3.5 bg-background"
          data-test-users-empty
        >
          <OrgUsersEmpty aria-hidden="true" />

          <AkTypography variant="h5">{akMT('noMembers')}</AkTypography>
        </div>
      )}

      {!isLoadingMembers && totalItems > 0 && (
        <Fragment>
          <AkTable
            columns={columns}
            data={rows}
            hoverable
            caption={akMT('users')}
            getRowId={(member) => String(member.member)}
            wrapperClassName="bg-background"
            onRowClick={openMember}
            data-test-users-table
          />

          <AkPagination
            totalItems={totalItems}
            limit={urlState.user_limit}
            offset={urlState.user_offset}
            itemPerPageOptions={PAGE_SIZES}
            onPageChange={({ limit, offset }) =>
              changeUrlState({ user_limit: limit, user_offset: offset })
            }
            onItemPerPageChange={({ limit }) =>
              changeUrlState({ user_limit: limit, user_offset: 0 })
            }
            tableItemLabel={akMT('users')}
            perPageLabel={akMT('recordPerPage')}
          />
        </Fragment>
      )}

      {/* irene lists what it is still waiting on under the members themselves. */}
      <InvitationList />

      <MemberDrawer membership={openedMember} onClose={() => setOpenedMember(null)} />
    </div>
  );
}
