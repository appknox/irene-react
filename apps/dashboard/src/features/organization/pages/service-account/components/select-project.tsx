import { Fragment, useState } from 'react';

import {
  AkSelect,
  AkSelectContent,
  AkSelectItem,
  AkSelectTrigger,
  AkSelectValue,
} from '@irene/ui/ak-select';

import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkLabel } from '@irene/ui/ak-label';
import { AkPagination } from '@irene/ui/ak-pagination';
import { AkTypography } from '@irene/ui/ak-typography';
import OrgDataEmpty from '@irene/ui/svgs/org-data-empty.svg?react';
import type { ApiOrganizationProject } from '@irene/api/services/organization';

import { AddProjectDrawer } from './add-project-drawer';
import { ProjectName } from './project-name';
import { SectionCard } from './section-card';

/** The page sizes irene offers on the chosen list. */
const PAGE_SIZES = [5, 10, 20];

interface SelectProjectSectionProps {
  /** Whether the account reaches every project, rather than the ones chosen here. */
  allProjects: boolean;
  onAllProjectsChange: (allProjects: boolean) => void;

  /** The projects chosen so far, which are only written once the account exists. */
  projects: ApiOrganizationProject[];
  onProjectsChange: (projects: ApiOrganizationProject[]) => void;
}

/**
 * Which projects a new account reaches.
 *
 * An account may reach everything the organization has, or only what is chosen
 * here. Nothing is written yet: the account does not exist until the page is
 * saved, so the choices are held until then, as irene holds them.
 *
 * @param props.allProjects - Whether it reaches every project.
 * @param props.onAllProjectsChange - Called with the new choice.
 * @param props.projects - The projects chosen so far.
 * @param props.onProjectsChange - Called with the projects as they now stand.
 */
export function SelectProjectSection({
  allProjects,
  onAllProjectsChange,
  projects,
  onProjectsChange,
}: Readonly<SelectProjectSectionProps>) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [page, setPage] = useState({ limit: PAGE_SIZES[0] ?? 5, offset: 0 });

  const shown = projects.slice(page.offset, page.offset + page.limit);

  return (
    <SectionCard title={akMT('selectProject')} testAttribute="service-account-projects">
      <div className="flex flex-col gap-1">
        <AkLabel htmlFor="project-access" className="text-lg font-bold">
          {akMT('serviceAccountModule.projectAccess')}
        </AkLabel>

        <AkSelect
          value={String(allProjects)}
          onValueChange={(value) => onAllProjectsChange(value === 'true')}
        >
          <AkSelectTrigger
            id="project-access"
            className="w-6/12 bg-background"
            data-test-service-account-project-access
          >
            <AkSelectValue />
          </AkSelectTrigger>

          <AkSelectContent>
            <AkSelectItem value="true">{akMT('allProjects')}</AkSelectItem>

            <AkSelectItem value="false">
              {akMT('serviceAccountModule.forSpecificProjects')}
            </AkSelectItem>
          </AkSelectContent>
        </AkSelect>

        <div className="mt-1.75 flex items-center gap-1">
          <AkIcon name="material-symbols:info" className="size-4 text-foreground" aria-hidden />

          <AkTypography data-test-service-account-project-access-note>
            {akMT('serviceAccountModule.projectAccessDescription')}
          </AkTypography>
        </div>
      </div>

      {!allProjects && (
        <div
          className="mt-5.25 rounded-xs border border-border"
          data-test-service-account-project-list
        >
          {projects.length === 0 && (
            <div className="flex flex-col items-center gap-3.5 p-8.75">
              <OrgDataEmpty aria-hidden="true" />

              <div className="flex flex-col items-center gap-1">
                <AkTypography variant="h6">
                  {akMT('serviceAccountModule.emptyProjectListTitle')}
                </AkTypography>

                <AkTypography color="textSecondary">
                  {akMT('serviceAccountModule.emptyProjectListDescription')}
                </AkTypography>
              </div>

              <AkButton
                className="mt-3.5"
                onClick={() => setIsPickerOpen(true)}
                data-test-service-account-add-project-empty
              >
                {akMT('addProject')}
              </AkButton>
            </div>
          )}

          {projects.length > 0 && (
            <Fragment>
              <div className="flex items-center justify-between gap-2.75 p-3.5">
                <div className="flex flex-col gap-1">
                  <AkTypography tag="h4" variant="h6">
                    {akMT('serviceAccountModule.selectedProjectListTitle')}
                  </AkTypography>

                  <AkTypography variant="body2" color="textSecondary">
                    {akMT('serviceAccountModule.selectedProjectListDescription')}
                  </AkTypography>
                </div>

                <AkButton
                  onClick={() => setIsPickerOpen(true)}
                  data-test-service-account-add-project
                >
                  {akMT('addProject')}
                </AkButton>
              </div>

              <ul className="flex flex-col">
                {shown.map((project) => (
                  <li
                    key={project.id}
                    className="
                      flex items-center justify-between gap-2.75 border-t border-divider px-3.5
                      py-2.75
                    "
                    data-test-service-account-project-item={project.id}
                  >
                    <ProjectName packageName={project.package_name} platform={project.platform} />

                    <AkIconButton
                      size="small"
                      title={akMT('remove')}
                      aria-label={`${akMT('remove')} ${project.package_name}`}
                      onClick={() =>
                        onProjectsChange(projects.filter((chosen) => chosen.id !== project.id))
                      }
                      data-test-service-account-remove-project={project.id}
                    >
                      <AkIcon name="material-symbols:delete" />
                    </AkIconButton>
                  </li>
                ))}
              </ul>

              {projects.length > PAGE_SIZES[0] && (
                <AkPagination
                  totalItems={projects.length}
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
            </Fragment>
          )}
        </div>
      )}

      <AddProjectDrawer
        isOpen={isPickerOpen}
        chosen={projects}
        onClose={() => setIsPickerOpen(false)}
        onAdd={(added) => onProjectsChange([...projects, ...added])}
      />
    </SectionCard>
  );
}
