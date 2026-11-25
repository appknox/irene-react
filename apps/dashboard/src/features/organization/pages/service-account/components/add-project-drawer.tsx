import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkAppbar } from '@irene/ui/ak-appbar';
import { AkButton } from '@irene/ui/ak-button';
import { AkCheckbox } from '@irene/ui/ak-checkbox';
import { AkDrawer, AkDrawerBody, AkDrawerContent, AkDrawerHeader } from '@irene/ui/ak-drawer';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkInput } from '@irene/ui/ak-input';
import { AkPagination } from '@irene/ui/ak-pagination';
import { AkSpinner } from '@irene/ui/ak-spinner';
import { AkTable } from '@irene/ui/ak-table';
import { createAkTableColumns } from '@irene/ui/ak-table/helpers';
import { AkTypography } from '@irene/ui/ak-typography';
import OrgDataEmpty from '@irene/ui/svgs/org-data-empty.svg?react';
import type { ApiOrganizationProject } from '@irene/api/services/organization';

import { useOrganization } from '@/hooks/use-organization';
import { organizationProjectsOptions } from '@/queries/organization';

import { ProjectName } from './project-name';

/** The page sizes irene offers in the picker. */
const PAGE_SIZES = [10, 25, 50];

const column = createAkTableColumns<ApiOrganizationProject>();

interface AddProjectDrawerProps {
  isOpen: boolean;
  onClose: () => void;

  /** The projects already chosen, which the picker shows as ticked. */
  chosen: ApiOrganizationProject[];
  onAdd: (projects: ApiOrganizationProject[]) => void;
}

/**
 * The projects an account may be given, chosen a page at a time.
 *
 * What is ticked here is added when the control below is pressed, which is how
 * irene stages a new account's projects: the account does not exist yet, so
 * nothing can be written to it until it is saved.
 *
 * @param props.isOpen - Whether the panel is open.
 * @param props.onClose - Called to close the panel.
 * @param props.chosen - The projects already chosen.
 * @param props.onAdd - Called with the projects to add.
 */
export function AddProjectDrawer({
  isOpen,
  onClose,
  chosen,
  onAdd,
}: Readonly<AddProjectDrawerProps>) {
  const { selected } = useOrganization();

  const [page, setPage] = useState({ limit: PAGE_SIZES[0] ?? 10, offset: 0 });
  const [query, setQuery] = useState('');
  const [ticked, setTicked] = useState<ApiOrganizationProject[]>([]);

  const projects = useQuery(organizationProjectsOptions(selected?.id, { ...page, query }));

  const rows = projects.data?.items ?? [];
  const totalItems = projects.data?.count ?? 0;
  const isLoading = projects.isPending || projects.isPlaceholderData;

  const isTicked = (project: ApiOrganizationProject) =>
    ticked.some((picked) => picked.id === project.id) ||
    chosen.some((picked) => picked.id === project.id);

  const tick = (project: ApiOrganizationProject, isChosen: boolean) =>
    setTicked((current) =>
      isChosen ? [...current, project] : current.filter((picked) => picked.id !== project.id)
    );

  const close = () => {
    setTicked([]);
    setQuery('');
    onClose();
  };

  const columns = column.columns([
    column.display({
      id: 'project',
      header: () => akMT('project'),
      cell: ({ row }) => (
        <ProjectName packageName={row.original.package_name} platform={row.original.platform} />
      ),
    }),

    column.display({
      id: 'action',
      header: () => akMT('action'),
      meta: { width: '15%', align: 'center' },
      cell: ({ row }) => (
        <AkCheckbox
          checked={isTicked(row.original)}
          disabled={chosen.some((picked) => picked.id === row.original.id)}
          onCheckedChange={(checked) => tick(row.original, checked === true)}
          aria-label={row.original.package_name}
          data-test-add-project-checkbox={row.original.id}
        />
      ),
    }),
  ]);

  return (
    <AkDrawer open={isOpen} onOpenChange={(open) => !open && close()}>
      <AkDrawerContent className="w-160" data-test-add-project-drawer>
        <AkAppbar className="shrink-0">
          <AkDrawerHeader title={akMT('addProject')} closeLabel={akMT('close')} />
        </AkAppbar>

        <AkDrawerBody noGutter className="flex flex-col px-5.25 py-3.5">
          <div className="mb-5.25 flex items-center justify-between gap-2.75">
            <div className="flex flex-col gap-1">
              <AkTypography tag="h3" variant="h6" data-test-add-project-title>
                {akMT('addProject')}
              </AkTypography>

              <AkTypography variant="body2" color="textSecondary">
                {akMT('serviceAccountModule.addProjectDescription')}
              </AkTypography>
            </div>

            <AkInput
              value={query}
              placeholder={akMT('searchProject')}
              aria-label={akMT('searchProject')}
              wrapperClassName="w-45"
              onChange={(event) => {
                setQuery(event.target.value);
                setPage((current) => ({ ...current, offset: 0 }));
              }}
              data-test-add-project-search
            />
          </div>

          {isLoading && (
            <div className="flex items-center justify-center gap-3.5 py-12.25">
              <AkSpinner className="size-4 text-primary" />

              <AkTypography>{`${akMT('loading')}...`}</AkTypography>
            </div>
          )}

          {!isLoading && totalItems === 0 && (
            <div
              className="flex flex-col items-center gap-3.5 py-12.25"
              data-test-add-project-empty
            >
              <OrgDataEmpty aria-hidden="true" />

              <AkTypography variant="h6">{akMT('noProject')}</AkTypography>
            </div>
          )}

          {!isLoading && totalItems > 0 && (
            <AkTable
              dense
              columns={columns}
              data={rows}
              caption={akMT('addProject')}
              getRowId={(project) => String(project.id)}
              data-test-add-project-table
            />
          )}

          {!isLoading && totalItems > 0 && (
            <AkPagination
              totalItems={totalItems}
              limit={page.limit}
              offset={page.offset}
              itemPerPageOptions={PAGE_SIZES}
              onPageChange={setPage}
              onItemPerPageChange={({ limit }) => setPage({ limit, offset: 0 })}
              tableItemLabel={akMT('projects')}
              perPageLabel={akMT('recordPerPage')}
            />
          )}
        </AkDrawerBody>

        <div className="flex items-center gap-2.75 px-5.25 py-3.5 shadow-4">
          <AkButton
            disabled={ticked.length === 0}
            onClick={() => {
              onAdd(ticked);
              close();
            }}
            data-test-add-project-confirm
          >
            <AkIcon name="material-symbols:add" />

            {akMT('addProject')}
          </AkButton>

          <AkButton variant="outlined" color="neutral" onClick={close} data-test-add-project-cancel>
            {akMT('cancel')}
          </AkButton>
        </div>
      </AkDrawerContent>
    </AkDrawer>
  );
}
