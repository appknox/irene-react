import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import type {
  ApiOrganizationProject,
  ApiOrganizationTeam,
} from '@irene/api/services/organization';
import { OrganizationService } from '@irene/api/services/organization';
import { getApiErrorMessage, unlessRateLimited } from '@irene/api/utils/errors';
import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';
import { AkCheckbox } from '@irene/ui/ak-checkbox';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkInput } from '@irene/ui/ak-input';
import { AkPagination } from '@irene/ui/ak-pagination';
import { AkTable } from '@irene/ui/ak-table';
import { createAkTableColumns } from '@irene/ui/ak-table/helpers';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';
import OrgNamespaceEmpty from '@irene/ui/svgs/org-namespace-empty.svg?react';

import { TableSkeleton } from '@/components/table-skeleton';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useOrganization } from '@/hooks/use-organization';
import { organizationKeys, organizationProjectsOptions } from '@/queries/organization';

import { TeamActionFooter } from './team-action-footer';

/* The page sizes irene offers when picking projects to add. */
const PAGE_SIZES = [10, 25, 50];
const SEARCH_DEBOUNCE_MS = 500;

interface AddTeamProjectsProps {
  team: ApiOrganizationTeam;
  onDone: () => void;
}

const projectColumn = createAkTableColumns<ApiOrganizationProject>();

/**
 * Picks projects out of the organization and puts them in a team.
 *
 * Only those not already in it are listed, and they are added one at a time as
 * irene adds them, so one refusal does not take the rest down with it.
 *
 * @param props.team - The team to add them to.
 * @param props.onDone - Called to leave the pane.
 */
export function AddTeamProjects({ team, onDone }: Readonly<AddTeamProjectsProps>) {
  const queryClient = useQueryClient();
  const organization = useOrganization();

  const [page, setPage] = useState({ limit: PAGE_SIZES[0], offset: 0 });
  const [searchText, setSearchText] = useState('');
  const [picked, setPicked] = useState<number[]>([]);

  const settledSearch = useDebouncedValue(searchText, SEARCH_DEBOUNCE_MS);

  /* A narrowed list is a different list, so it starts at its own first page. */
  const search = (text: string) => {
    setSearchText(text);
    setPage((current) => ({ ...current, offset: 0 }));
  };

  const projects = useQuery(
    organizationProjectsOptions(organization.selected?.id, {
      ...page,
      query: settledSearch,
      excludeTeam: team.id,
    })
  );

  const add = useMutation({
    mutationFn: async (projectIds: number[]) => {
      for (const projectId of projectIds) {
        await OrganizationService.addOrganizationTeamProject(
          organization.selectedId(),
          team.id,
          projectId
        );
      }
    },

    onSuccess: async () => {
      akNotify.success(akMT('teamProjectAdded'));
      setPicked([]);

      /*
        The team's projects and the count beside it have changed, and the
        project just added is no longer one this team could be given.
      */
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: organizationKeys.teamRecords(organization.selected?.id, team.id, 'projects'),
        }),
        queryClient.invalidateQueries({
          queryKey: organizationKeys.team(organization.selected?.id, team.id),
        }),
        queryClient.invalidateQueries({
          queryKey: organizationKeys.teamsList(organization.selected?.id),
        }),

        queryClient.invalidateQueries({
          queryKey: organizationKeys.projectsList(organization.selected?.id),
        }),
      ]);
    },

    onError: unlessRateLimited((error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    }),
  });

  const rows = projects.data?.items ?? [];
  const totalItems = projects.data?.count ?? 0;
  const isLoading = projects.isPending || projects.isPlaceholderData;

  const togglePicked = (projectId: number, isPicked: boolean) =>
    setPicked((current) =>
      isPicked ? [...current, projectId] : current.filter((id) => id !== projectId)
    );

  const columns = projectColumn.columns([
    projectColumn.accessor('package_name', {
      header: () => akMT('name'),
      meta: { width: '75%' },
      cell: ({ row, getValue }) => (
        <div className="flex min-w-0 items-center gap-3.5">
          <AkIcon
            name={
              row.original.platform === ENUMS.PLATFORM.IOS
                ? 'fa-brands:apple'
                : 'material-symbols:android'
            }
            size="1.2rem"
            className={row.original.platform === ENUMS.PLATFORM.IOS ? 'text-ios' : 'text-android'}
            aria-hidden
          />

          <AkTypography
            tag="span"
            noWrap
            title={getValue()}
            className="min-w-0"
            data-test-add-project-name
          >
            {getValue()}
          </AkTypography>
        </div>
      ),
    }),

    projectColumn.display({
      id: 'action',
      header: () => akMT('action'),
      meta: { width: '25%', align: 'center' },
      cell: ({ row }) => (
        <AkCheckbox
          checked={picked.includes(row.original.id)}
          disabled={add.isPending}
          onCheckedChange={(checked) => togglePicked(row.original.id, checked === true)}
          aria-label={`${akMT('addProject')} ${row.original.package_name}`}
          data-test-add-project-pick
        />
      ),
    }),
  ]);

  return (
    /*
      Fills what the drawer's header leaves, and may shrink below its own
      content, so what scrolls inside it scrolls rather than pushing the
      footer past the bottom of the panel.
    */
    <div className="flex min-h-0 flex-1 flex-col" data-test-add-team-projects>
      <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto p-5.25">
        <div className="flex items-start justify-between gap-3.5">
          <div className="flex flex-col gap-1">
            <AkTypography tag="h3" variant="h6" data-test-add-projects-title>
              {akMT('addProject')}
            </AkTypography>

            <AkTypography variant="body2" color="textSecondary">
              {akMT('addTeamProjectDesc')}
            </AkTypography>
          </div>

          <div className="relative w-45 shrink-0">
            <AkIcon
              name="material-symbols:search"
              size="1.25rem"
              className="absolute top-1/2 left-2.5 -translate-y-1/2 text-foreground-muted"
              aria-hidden
            />

            <AkInput
              value={searchText}
              onChange={(event) => search(event.target.value)}
              placeholder={akMT('searchProject')}
              aria-label={akMT('searchProject')}
              className="pl-8.5"
              data-test-add-project-search
            />
          </div>
        </div>

        {isLoading && (
          <TableSkeleton columns={columns} rows={5} dense caption={akMT('projects')} />
        )}

        {!isLoading && totalItems === 0 && (
          <div
            className="flex min-h-50 w-full flex-col items-center justify-center gap-3.5"
            data-test-add-projects-empty
          >
            <OrgNamespaceEmpty aria-hidden="true" className="h-25" />

            <AkTypography variant="h6">{akMT('noProject')}</AkTypography>
          </div>
        )}

        {!isLoading && totalItems > 0 && (
          <AkTable
            columns={columns}
            data={rows}
            dense
            caption={akMT('addProject')}
            getRowId={(project) => String(project.id)}
            data-test-add-projects-table
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
            tableItemLabel={akMT('projects')}
            perPageLabel={akMT('recordPerPage')}
          />
        )}
      </div>

      <TeamActionFooter
        actionLabel={akMT('addProject')}
        isWorking={add.isPending}
        isDisabled={picked.length === 0}
        onAction={() => add.mutate(picked)}
        onBack={onDone}
      />
    </div>
  );
}
