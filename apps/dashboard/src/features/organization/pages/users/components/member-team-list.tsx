import { useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import type { ApiOrganizationTeam } from '@irene/api/services/organization';
import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkInput } from '@irene/ui/ak-input';
import { AkPagination } from '@irene/ui/ak-pagination';
import { AkTable } from '@irene/ui/ak-table';
import { createAkTableColumns } from '@irene/ui/ak-table/helpers';
import { AkTypography } from '@irene/ui/ak-typography';
import TeamsEmpty from '@irene/ui/svgs/teams-empty.svg?react';

import { TableSkeleton } from '@/components/table-skeleton';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useOrganization } from '@/hooks/use-organization';
import { organizationTeamsOptions } from '@/queries/organization';

/* The page sizes irene offers inside the drawer, which are smaller than a page's own. */
const PAGE_SIZES = [5, 10, 20];
const SEARCH_DEBOUNCE_MS = 500;

interface MemberTeamListProps {
  title: string;
  description: string;
  userId: number;

  /** Whether to list the teams the member is in, or the ones they are not. */
  shows: 'joined' | 'joinable';

  /** What acts on a team in a row, for an administrator. */
  action?: (team: ApiOrganizationTeam) => ReactNode;
}

const teamColumn = createAkTableColumns<ApiOrganizationTeam>();

/**
 * The teams beside one member, searchable and a page at a time.
 *
 * The same list serves both of the drawer's views: the teams the member is in,
 * where a row takes them out, and the teams they are not in, where a row puts
 * them in. irene reads both from the teams endpoint, narrowed to or away from
 * the member.
 *
 * @param props.title - What the list is, above it.
 * @param props.description - The line under that title.
 * @param props.userId - The member the list is about.
 * @param props.shows - Whether these are the teams they are in or the ones they are not.
 * @param props.action - What acts on a team in a row, left out for an account that may not.
 */
export function MemberTeamList({
  title,
  description,
  userId,
  shows,
  action,
}: Readonly<MemberTeamListProps>) {
  const { selected } = useOrganization();

  const [page, setPage] = useState({ limit: PAGE_SIZES[0], offset: 0 });
  const [searchText, setSearchText] = useState('');

  const settledSearch = useDebouncedValue(searchText, SEARCH_DEBOUNCE_MS);

  /* A narrowed list is a different list, so it starts at its own first page. */
  const search = (text: string) => {
    setSearchText(text);
    setPage((current) => ({ ...current, offset: 0 }));
  };

  const teams = useQuery(
    organizationTeamsOptions(selected?.id, {
      ...page,
      query: settledSearch,
      ...(shows === 'joined' ? { includeUser: userId } : { excludeUser: userId }),
    })
  );

  const rows = teams.data?.items ?? [];
  const totalItems = teams.data?.count ?? 0;
  const isLoading = teams.isPending || teams.isPlaceholderData;

  const columns = teamColumn.columns([
    teamColumn.accessor('name', {
      header: () => akMT('teamName'),
      meta: { width: '75%' },
      cell: ({ getValue }) => (
        <AkTypography tag="span" noWrap title={getValue()} data-test-member-team-name>
          {getValue()}
        </AkTypography>
      ),
    }),

    ...(action
      ? [
          teamColumn.display({
            id: 'action',
            header: () => akMT('action'),
            meta: { width: '25%', align: 'right' as const },
            cell: ({ row }) => action(row.original),
          }),
        ]
      : []),
  ]);

  return (
    <div className="flex w-full flex-col" data-test-member-team-list>
      <div className="mb-3.5 flex items-start justify-between gap-3.5">
        <div className="flex flex-col gap-1">
          <AkTypography tag="h3" variant="h6" data-test-member-team-list-title>
            {title}
          </AkTypography>

          <AkTypography variant="body2" color="textSecondary">
            {description}
          </AkTypography>
        </div>

        <div className="relative w-45 shrink-0 bg-background">
          <AkIcon
            name="material-symbols:search"
            size="1.25rem"
            className="absolute top-1/2 left-2.5 -translate-y-1/2 text-foreground-muted"
            aria-hidden
          />

          <AkInput
            value={searchText}
            onChange={(event) => search(event.target.value)}
            placeholder={akMT('searchTeam')}
            aria-label={akMT('searchTeam')}
            className="pl-8.5"
            data-test-member-team-search
          />
        </div>
      </div>

      {isLoading && (
        <TableSkeleton columns={columns} rows={3} dense caption={akMT('teams')} />
      )}

      {!isLoading && totalItems === 0 && (
        <div
          className="
            flex min-h-37.5 w-full flex-col items-center justify-center gap-3.5 rounded-xs border
            border-border p-5.25
          "
          data-test-member-team-list-empty
        >
          <TeamsEmpty aria-hidden="true" className="h-30" />

          <AkTypography variant="h6">{akMT('noTeams')}</AkTypography>
        </div>
      )}

      {!isLoading && totalItems > 0 && (
        <AkTable
          columns={columns}
          data={rows}
          dense
          caption={akMT('teams')}
          getRowId={(team) => String(team.id)}
          data-test-member-team-list-table
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
          tableItemLabel={akMT('teams')}
          perPageLabel={akMT('recordPerPage')}
        />
      )}
    </div>
  );
}
