import { useQuery } from '@tanstack/react-query';
import { Fragment, useEffect, useState } from 'react';

import type { ApiOrganizationTeam } from '@irene/api/services/organization';
import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkInput } from '@irene/ui/ak-input';
import { AkPagination } from '@irene/ui/ak-pagination';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkTypography } from '@irene/ui/ak-typography';
import TeamsEmpty from '@irene/ui/svgs/teams-empty.svg?react';

import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useOrganization } from '@/hooks/use-organization';
import { useUrlState } from '@/hooks/use-url-state';
import { organizationTeamsOptions } from '@/queries/organization';

import { CreateTeam } from './components/create-team';
import { TeamDetails } from './components/team-details';
import { TeamOverview } from './components/team-overview';

/* The page sizes irene offers here, rather than the design system's own. */
const PAGE_SIZES = [10, 25, 50];

/** How many cards stand in for the teams while they load. */
const TEAM_PLACEHOLDERS = [1, 2, 3];

/* How long typing holds still before the list is asked for, as irene waits. */
const SEARCH_DEBOUNCE_MS = 500;

/* The query parameters irene keeps this list in, so a link to one still works. */
const TEAMS_URL_STATE = {
  team_limit: PAGE_SIZES[0],
  team_offset: 0,
  team_query: '',
};

/**
 * The teams in the organization, and how to find them.
 *
 * An administrator is told there are none to manage; anyone else is told they
 * belong to none, since that is what the absence means to them.
 */
export function OrganizationTeamsPage() {
  const { selected, me } = useOrganization();

  const [urlState, changeUrlState] = useUrlState(TEAMS_URL_STATE);

  /* What is in the field now; the list follows once the typing settles. */
  const [searchText, setSearchText] = useState(urlState.team_query);

  /*
    Which team's details are open. The team itself rather than its id, so the
    drawer opens on what the card already shows rather than on nothing.
  */
  const [openTeam, setOpenTeam] = useState<ApiOrganizationTeam | null>(null);
  const settledSearch = useDebouncedValue(searchText, SEARCH_DEBOUNCE_MS);

  const teams = useQuery(
    organizationTeamsOptions(selected?.id, {
      limit: urlState.team_limit,
      offset: urlState.team_offset,
      query: urlState.team_query,
    })
  );

  /* A narrowed list is a different list, so it starts at its own first page. */
  useEffect(() => {
    if (settledSearch !== urlState.team_query) {
      changeUrlState({ team_query: settledSearch, team_offset: 0 });
    }
  }, [settledSearch, urlState.team_query, changeUrlState]);

  const rows = teams.data?.items ?? [];
  const totalItems = teams.data?.count ?? 0;

  /*
    Drawn before the first answer and while another page or search is being
    read. A refresh of the page already shown keeps its rows, so adding or
    removing a team does not empty the list. Until there is an organization the
    query has not started, which is not the same as a list with nothing in it.
  */
  const isLoadingTeams = teams.isPending || teams.isPlaceholderData;

  return (
    <div className="flex w-full flex-col" data-test-organization-teams>
      <div className="flex w-full items-center justify-between gap-3.5 py-5.25">
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
            placeholder={akMT('searchTeam')}
            aria-label={akMT('searchTeam')}
            className="pl-8.5"
            data-test-team-search
          />
        </div>

        {me?.is_admin && <CreateTeam />}
      </div>

      {/* Cards shaped like the ones they stand in for, so the list does not move when they land. */}
      {isLoadingTeams && (
        <div className="flex w-full flex-col gap-3.5" aria-busy data-test-teams-loading>
          {TEAM_PLACEHOLDERS.map((placeholder) => (
            <div
              key={placeholder}
              className="flex w-full flex-col rounded-xs border border-border bg-background p-3.5"
            >
              <AkSkeleton width="14rem" height="1.5rem" className="mb-1.75" />

              <div className="flex gap-3.5">
                <AkSkeleton width="6rem" height="1rem" />

                <AkSkeleton width="6rem" height="1rem" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoadingTeams && totalItems === 0 && (
        <div
          className="
            flex min-h-62.5 w-full flex-col items-center justify-center gap-3.5 bg-background p-5.25
          "
          data-test-teams-empty
        >
          <TeamsEmpty className="h-37.5" aria-hidden="true" />

          <AkTypography variant="h5">
            {me?.is_admin ? akMT('noTeams') : akMT('noTeamsMember')}
          </AkTypography>
        </div>
      )}

      {!isLoadingTeams && totalItems > 0 && (
        <Fragment>
          <ul className="flex flex-col gap-3.5" data-test-teams-list>
            {rows.map((team) => (
              <TeamOverview key={team.id} team={team} onOpen={() => setOpenTeam(team)} />
            ))}
          </ul>

          <AkPagination
            totalItems={totalItems}
            limit={urlState.team_limit}
            offset={urlState.team_offset}
            itemPerPageOptions={PAGE_SIZES}
            onPageChange={({ limit, offset }) =>
              changeUrlState({ team_limit: limit, team_offset: offset })
            }
            onItemPerPageChange={({ limit }) =>
              changeUrlState({ team_limit: limit, team_offset: 0 })
            }
            tableItemLabel={akMT('teams')}
            perPageLabel={akMT('recordPerPage')}
          />
        </Fragment>
      )}

      <TeamDetails
        team={openTeam}
        isAdmin={Boolean(me?.is_admin)}
        onClose={() => setOpenTeam(null)}
      />
    </div>
  );
}
