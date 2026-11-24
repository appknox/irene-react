import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Fragment, useState } from 'react';

import type {
  ApiOrganizationTeam,
  ApiOrganizationTeamProject,
} from '@irene/api/services/organization';
import type { ApiPage } from '@irene/api/utils/pagination';
import { OrganizationService } from '@irene/api/services/organization';
import { getApiErrorMessage, unlessRateLimited } from '@irene/api/utils/errors';
import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';
import { AkCheckbox } from '@irene/ui/ak-checkbox';
import { AkConfirmBox } from '@irene/ui/ak-confirm-box';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { useOrganization } from '@/hooks/use-organization';
import { organizationKeys } from '@/queries/organization';
import { projectOptions } from '@/queries/project';

interface TeamProjectProps {
  team: ApiOrganizationTeam;
  project: ApiOrganizationTeamProject;
}

/**
 * The package a team project stands for, under the icon of its platform.
 *
 * A team project carries the project's id alone, so the package name is read
 * here, one row at a time, as irene reads it.
 *
 * @param props.project - The team's project, whose id names the package.
 */
export function TeamProjectInfo({ project }: Readonly<Pick<TeamProjectProps, 'project'>>) {
  const { data } = useQuery(projectOptions(project.id));

  const isApple = data?.platform === ENUMS.PLATFORM.IOS;

  return (
    <div className="flex min-w-0 items-center gap-3.5" data-test-team-project-info>
      {data && (
        <AkIcon
          name={isApple ? 'fa-brands:apple' : 'material-symbols:android'}
          size="1.2rem"
          className={isApple ? 'text-ios' : 'text-android'}
          aria-hidden
        />
      )}

      <AkTypography
        tag="span"
        noWrap
        title={data?.package_name}
        className="min-w-0"
        data-test-team-project-name
      >
        {data?.package_name ?? ''}
      </AkTypography>
    </div>
  );
}

/**
 * Whether the team may write to one of its projects.
 *
 * @param props.team - The team whose access this is.
 * @param props.project - The project the access is on.
 */
export function TeamProjectAccess({ team, project }: Readonly<TeamProjectProps>) {
  const queryClient = useQueryClient();
  const organization = useOrganization();

  const setWrite = useMutation({
    mutationFn: (write: boolean) =>
      OrganizationService.setOrganizationTeamProjectWrite(
        organization.selectedId(),
        team.id,
        project.id,
        write
      ),

    /*
      The answer is written into the pages already read rather than sending
      them for again. Only this one row changed, and a refetch would empty the
      table it is in — and, where the lists are read together, the tables
      beside it.
    */
    onSuccess: (updated) => {
      akNotify.success(akMT('permissionChanged'));

      queryClient.setQueriesData<ApiPage<ApiOrganizationTeamProject>>(
        { queryKey: organizationKeys.teamRecords(organization.selected?.id, team.id, 'projects') },
        (page) =>
          page && {
            ...page,
            items: page.items.map((item) =>
              item.id === project.id ? { ...item, write: updated.write } : item
            ),
          }
      );
    },

    onError: unlessRateLimited((error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    }),
  });

  const checkboxId = `team-project-write-${project.id}`;

  return (
    <div className="flex items-center gap-1.75">
      <AkCheckbox
        id={checkboxId}
        checked={project.write}
        disabled={setWrite.isPending}
        onCheckedChange={(checked) => setWrite.mutate(checked === true)}
        data-test-team-project-write
      />

      <label htmlFor={checkboxId}>
        <AkTypography tag="span">{akMT('allowEdit')}</AkTypography>
      </label>
    </div>
  );
}

/**
 * Takes one project out of a team.
 *
 * @param props.team - The team to remove it from.
 * @param props.project - The project to remove.
 */
export function RemoveTeamProject({ team, project }: Readonly<TeamProjectProps>) {
  const queryClient = useQueryClient();
  const organization = useOrganization();
  const [isAsking, setIsAsking] = useState(false);

  const remove = useMutation({
    mutationFn: () =>
      OrganizationService.removeOrganizationTeamProject(
        organization.selectedId(),
        team.id,
        project.id
      ),

    onSuccess: async () => {
      akNotify.success(akMT('projectRemoved'));
      setIsAsking(false);

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
      ]);
    },

    onError: unlessRateLimited((error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    }),
  });

  return (
    <Fragment>
      <AkIconButton
        onClick={() => setIsAsking(true)}
        title={akMT('removeFromTeam')}
        aria-label={akMT('removeFromTeam')}
        data-test-team-project-remove
      >
        <AkIcon name="material-symbols:person-remove" />
      </AkIconButton>

      <AkConfirmBox
        isOpen={isAsking}
        description={akMT('confirmBox.removeTeamProject')}
        confirmText={akMT('remove')}
        blurOverlay
        isWorking={remove.isPending}
        onConfirm={() => remove.mutate()}
        onCancel={() => setIsAsking(false)}
      />
    </Fragment>
  );
}
