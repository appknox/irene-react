import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Fragment, useState } from 'react';

import type { ApiOrganizationTeam } from '@irene/api/services/organization';
import { OrganizationService } from '@irene/api/services/organization';
import { getApiErrorMessage, unlessRateLimited } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkConfirmBox } from '@irene/ui/ak-confirm-box';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkInput } from '@irene/ui/ak-input';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { useOrganization } from '@/hooks/use-organization';
import { organizationKeys } from '@/queries/organization';

interface DeleteTeamProps {
  team: ApiOrganizationTeam;
  onDeleted: () => void;
}

/**
 * Removes a team, once its name has been typed.
 *
 * irene asks for the name rather than a plain confirmation: a team takes its
 * members and projects with it, so it is not removed by one stray click.
 *
 * @param props.team - The team to remove.
 * @param props.onDeleted - Called once it is gone, which closes the drawer behind it.
 */
export function DeleteTeam({ team, onDeleted }: Readonly<DeleteTeamProps>) {
  const queryClient = useQueryClient();
  const organization = useOrganization();

  const [isAsking, setIsAsking] = useState(false);
  const [typedName, setTypedName] = useState('');

  const remove = useMutation({
    mutationFn: () =>
      OrganizationService.deleteOrganizationTeam(organization.selectedId(), team.id),

    onSuccess: async () => {
      akNotify.success(`${team.name} ${akMT('teamDeleted')}`);
      setIsAsking(false);
      setTypedName('');
      onDeleted();

      /* The team is gone, so the list of them is read again and what it held is dropped. */
      queryClient.removeQueries({
        queryKey: organizationKeys.team(organization.selected?.id, team.id),
      });

      await queryClient.invalidateQueries({
        queryKey: organizationKeys.teamsList(organization.selected?.id),
      });
    },

    onError: unlessRateLimited((error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    }),
  });

  /* The name is matched as irene matches it: case and surrounding space aside. */
  const confirmRemoval = () => {
    if (typedName.trim().toLowerCase() !== team.name.toLowerCase()) {
      akNotify.error(akMT('enterRightTeamName'));

      return;
    }

    remove.mutate();
  };

  return (
    <Fragment>
      <AkButton variant="outlined" onClick={() => setIsAsking(true)} data-test-team-delete>
        <AkIcon name="material-symbols:delete" />

        {akMT('deleteTeam')}
      </AkButton>

      <AkConfirmBox
        isOpen={isAsking}
        confirmText={akMT('deleteTeam')}
        blurOverlay
        isWorking={remove.isPending}
        onConfirm={confirmRemoval}
        onCancel={() => {
          setIsAsking(false);
          setTypedName('');
        }}
      >
        <div className="flex w-full flex-col gap-1.75">
          <label htmlFor="delete-team-name">
            <AkTypography tag="span" variant="subtitle2">
              {akMT('promptBox.deleteTeamPrompt.description')}
            </AkTypography>
          </label>

          <AkInput
            id="delete-team-name"
            value={typedName}
            onChange={(event) => setTypedName(event.target.value)}
            autoFocus
            data-test-team-delete-prompt
          />
        </div>
      </AkConfirmBox>
    </Fragment>
  );
}
