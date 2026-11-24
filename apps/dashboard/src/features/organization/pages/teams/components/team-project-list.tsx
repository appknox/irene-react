import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import type {
  ApiOrganizationTeam,
  ApiOrganizationTeamProject,
} from '@irene/api/services/organization';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkPagination } from '@irene/ui/ak-pagination';
import { AkTable } from '@irene/ui/ak-table';
import { createAkTableColumns } from '@irene/ui/ak-table/helpers';
import { AkTypography } from '@irene/ui/ak-typography';
import OrgNamespaceEmpty from '@irene/ui/svgs/org-namespace-empty.svg?react';

import { TableSkeleton } from '@/components/table-skeleton';
import { useOrganization } from '@/hooks/use-organization';
import { organizationTeamProjectsOptions } from '@/queries/organization';

import { RemoveTeamProject, TeamProjectAccess, TeamProjectInfo } from './team-project-row';

/* The page sizes irene offers inside the drawer, which are smaller than a page's own. */
const PAGE_SIZES = [5, 10, 20];

interface TeamProjectListProps {
  team: ApiOrganizationTeam;
  isAdmin: boolean;
  onAddProjects: () => void;
}

const projectColumn = createAkTableColumns<ApiOrganizationTeamProject>();

/**
 * Builds the columns of the team's project table.
 *
 * @param team - The team the projects belong to, which the row's actions need.
 * @param isAdmin - Whether this account may set access and remove a project.
 * @returns The columns, the access and action ones only for an administrator.
 */
function buildProjectColumns(team: ApiOrganizationTeam, isAdmin: boolean) {
  return projectColumn.columns([
    projectColumn.display({
      id: 'project',
      /* irene capitalizes this one heading, since the key itself is lower case. */
      header: () => <span className="capitalize">{akMT('project')}</span>,
      cell: ({ row }) => <TeamProjectInfo project={row.original} />,
    }),

    ...(isAdmin
      ? [
          projectColumn.display({
            id: 'access',
            header: () => akMT('accessPermissions'),
            cell: ({ row }) => <TeamProjectAccess team={team} project={row.original} />,
          }),

          projectColumn.display({
            id: 'action',
            header: () => akMT('action'),
            meta: { align: 'center' as const },
            cell: ({ row }) => <RemoveTeamProject team={team} project={row.original} />,
          }),
        ]
      : []),
  ]);
}

/**
 * The projects one team works on, a page at a time.
 *
 * @param props.team - The team whose projects to list.
 * @param props.isAdmin - Whether this account may add and remove projects.
 * @param props.onAddProjects - Opens the pane for adding projects to the team.
 */
export function TeamProjectList({ team, isAdmin, onAddProjects }: Readonly<TeamProjectListProps>) {
  const { selected } = useOrganization();
  const [page, setPage] = useState({ limit: PAGE_SIZES[0], offset: 0 });

  const projects = useQuery(organizationTeamProjectsOptions(selected?.id, team.id, page));

  const rows = projects.data?.items ?? [];
  const totalItems = projects.data?.count ?? 0;
  const isLoading = projects.isPending || projects.isPlaceholderData;

  const columns = buildProjectColumns(team, isAdmin);

  return (
    <div className="flex w-full flex-col" data-test-team-project-list>
      <div className="mb-3.5 flex items-center justify-between gap-3.5">
        <div className="flex flex-col gap-1">
          <AkTypography tag="h3" variant="h6" data-test-team-project-list-title>
            {akMT('projects')}
          </AkTypography>

          <AkTypography variant="body2" color="textSecondary">
            {akMT('teamProjectsDesc')}
          </AkTypography>
        </div>

        {isAdmin && (
          <AkButton onClick={onAddProjects} data-test-team-add-projects>
            <AkIcon name="material-symbols:note-add" />

            {akMT('addProject')}
          </AkButton>
        )}
      </div>

      {isLoading && (
        <TableSkeleton columns={columns} rows={3} dense caption={akMT('projects')} />
      )}

      {!isLoading && totalItems === 0 && (
        <div
          className="
            flex min-h-37.5 w-full flex-col items-center justify-center gap-3.5 rounded-xs border
            border-border p-5.25
          "
          data-test-team-project-list-empty
        >
          <OrgNamespaceEmpty aria-hidden="true" className="h-17.5" />

          <AkTypography variant="h6">{akMT('noProject')}</AkTypography>
        </div>
      )}

      {!isLoading && totalItems > 0 && (
        <AkTable
          columns={columns}
          data={rows}
          dense={isAdmin}
          caption={akMT('projects')}
          getRowId={(project) => String(project.id)}
          data-test-team-project-list-table
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
  );
}
