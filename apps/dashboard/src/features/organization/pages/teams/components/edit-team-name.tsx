import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import type { ApiOrganizationTeam } from '@irene/api/services/organization';
import { OrganizationService } from '@irene/api/services/organization';
import { getApiErrorMessage, unlessRateLimited } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkInput } from '@irene/ui/ak-input';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { useOrganization } from '@/hooks/use-organization';
import { organizationKeys } from '@/queries/organization';

import { TeamActionFooter } from './team-action-footer';

interface EditTeamNameProps {
  team: ApiOrganizationTeam;
  onDone: () => void;
}

/**
 * Renames a team.
 *
 * @param props.team - The team to rename.
 * @param props.onDone - Called to leave the pane, whether renamed or not.
 */
export function EditTeamName({ team, onDone }: Readonly<EditTeamNameProps>) {
  const queryClient = useQueryClient();
  const organization = useOrganization();
  const [name, setName] = useState(team.name);

  const rename = useMutation({
    mutationFn: (teamName: string) =>
      OrganizationService.renameOrganizationTeam(organization.selectedId(), team.id, teamName),

    onSuccess: async () => {
      akNotify.success(akMT('organizationTeamNameUpdated'));
      onDone();

      /* The name shows on the team and in the list of them, and nowhere else. */
      await Promise.all([
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

  const typedName = name.trim();

  /* Nothing to save while the field is empty or still holds the name it had. */
  const isUnchanged = typedName === '' || typedName === team.name;

  return (
    /*
      Fills what the drawer's header leaves, and may shrink below its own
      content, so what scrolls inside it scrolls rather than pushing the
      footer past the bottom of the panel.
    */
    <div className="flex min-h-0 flex-1 flex-col" data-test-edit-team-name>
      <div className="flex min-h-0 flex-1 flex-col gap-1.75 p-5.25">
        <label htmlFor="edit-team-name">
          <AkTypography tag="span" variant="h6">
            {akMT('editTeamNameInputLabel')}
          </AkTypography>
        </label>

        <AkInput
          id="edit-team-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoFocus
          data-test-edit-team-name-input
        />
      </div>

      <TeamActionFooter
        actionLabel={akMT('edit')}
        isWorking={rename.isPending}
        isDisabled={isUnchanged}
        onAction={() => rename.mutate(typedName)}
        onBack={onDone}
      />
    </div>
  );
}
