import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Fragment, useState } from 'react';

import type { ApiOrganizationTeam } from '@irene/api/services/organization';
import { OrganizationService } from '@irene/api/services/organization';
import { getApiErrorMessage, unlessRateLimited } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkConfirmBox } from '@irene/ui/ak-confirm-box';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkInput } from '@irene/ui/ak-input';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { useOrganization } from '@/hooks/use-organization';
import { organizationKeys, organizationUserOptions } from '@/queries/organization';

interface RemoveTeamMemberProps {
  team: ApiOrganizationTeam;
  userId: number;
}

/**
 * Takes one person out of a team, once their name has been typed.
 *
 * irene asks for the name rather than a plain confirmation, so a member is not
 * removed by a stray click on the wrong row.
 *
 * @param props.team - The team to remove them from.
 * @param props.userId - The person to remove.
 */
export function RemoveTeamMember({ team, userId }: Readonly<RemoveTeamMemberProps>) {
  const queryClient = useQueryClient();
  const organization = useOrganization();

  const [isAsking, setIsAsking] = useState(false);
  const [typedName, setTypedName] = useState('');

  const { data: user } = useQuery(organizationUserOptions(organization.selected?.id, userId));

  const remove = useMutation({
    mutationFn: () =>
      OrganizationService.removeOrganizationTeamMember(organization.selectedId(), team.id, userId),

    onSuccess: async () => {
      akNotify.success(akMT('teamMemberRemoved'));
      setIsAsking(false);
      setTypedName('');

      /* What changed is this team's members and the count beside it, and nothing else. */
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: organizationKeys.teamRecords(organization.selected?.id, team.id, 'members'),
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

  /* The name is matched as irene matches it: case and surrounding space aside. */
  const confirmRemoval = () => {
    if (typedName.trim().toLowerCase() !== (user?.username ?? '').toLowerCase()) {
      akNotify.error(akMT('enterRightUserName'));

      return;
    }

    remove.mutate();
  };

  return (
    <Fragment>
      <AkIconButton
        onClick={() => setIsAsking(true)}
        title={akMT('removeFromTeam')}
        aria-label={`${akMT('removeFromTeam')} ${user?.username ?? ''}`}
        data-test-team-member-remove
      >
        <AkIcon name="material-symbols:person-remove" />
      </AkIconButton>

      <AkConfirmBox
        isOpen={isAsking}
        confirmText={akMT('remove')}
        blurOverlay
        isWorking={remove.isPending}
        onConfirm={confirmRemoval}
        onCancel={() => {
          setIsAsking(false);
          setTypedName('');
        }}
      >
        <div className="flex w-full flex-col gap-1.75">
          <label htmlFor="remove-team-member-name">
            <AkTypography tag="span" variant="subtitle2">
              {akMT('promptBox.removeMemberPrompt.description')}
            </AkTypography>
          </label>

          <AkInput
            id="remove-team-member-name"
            value={typedName}
            onChange={(event) => setTypedName(event.target.value)}
            autoFocus
            data-test-team-member-remove-prompt
          />
        </div>
      </AkConfirmBox>
    </Fragment>
  );
}
