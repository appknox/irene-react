import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Fragment, useState } from 'react';

import type { ApiOrganizationTeam } from '@irene/api/services/organization';
import { OrganizationService } from '@irene/api/services/organization';
import { getApiErrorMessage, unlessRateLimited } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkConfirmBox } from '@irene/ui/ak-confirm-box';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkSpinner } from '@irene/ui/ak-spinner';
import { akNotify } from '@irene/ui/notify';

import { useOrganization } from '@/hooks/use-organization';
import { organizationKeys } from '@/queries/organization';

interface MemberTeamActionProps {
  team: ApiOrganizationTeam;
  userId: number;
}

/**
 * What a change to one member's teams touches.
 *
 * Every list of teams, since the member moves between two of them, the team
 * itself for the count on it, and the team's own members where that is open.
 *
 * @param organizationId - The organization the team belongs to.
 * @param teamId - The team the member was added to or taken out of.
 * @returns The keys to read again.
 */
const changedByTeamMembership = (organizationId: number | undefined, teamId: number) => [
  organizationKeys.teamsList(organizationId),
  organizationKeys.team(organizationId, teamId),
  organizationKeys.teamRecords(organizationId, teamId, 'members'),
];

/**
 * Takes one member out of a team, asked from the member rather than the team.
 *
 * @param props.team - The team to take them out of.
 * @param props.userId - The member to remove.
 */
export function RemoveMemberFromTeam({ team, userId }: Readonly<MemberTeamActionProps>) {
  const queryClient = useQueryClient();
  const organization = useOrganization();
  const [isAsking, setIsAsking] = useState(false);

  const remove = useMutation({
    mutationFn: () =>
      OrganizationService.removeOrganizationTeamMember(
        organization.selectedId(),
        team.id,
        userId
      ),

    onSuccess: async () => {
      akNotify.success(akMT('teamMemberRemoved'));
      setIsAsking(false);

      await Promise.all(
        changedByTeamMembership(organization.selected?.id, team.id).map((queryKey) =>
          queryClient.invalidateQueries({ queryKey })
        )
      );
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
        aria-label={`${akMT('removeFromTeam')} ${team.name}`}
        data-test-member-team-remove
      >
        <AkIcon name="material-symbols:person-remove" />
      </AkIconButton>

      <AkConfirmBox
        isOpen={isAsking}
        title={akMT('removeFromTeam')}
        description={akMT('confirmBox.removeUser')}
        confirmText={akMT('remove')}
        blurOverlay
        isWorking={remove.isPending}
        onConfirm={() => remove.mutate()}
        onCancel={() => setIsAsking(false)}
      />
    </Fragment>
  );
}

/**
 * Puts one member into a team, asked from the member rather than the team.
 *
 * irene adds them without write access and asks nothing first: the team is
 * listed because they are not in it, and the row leaves the list once they are.
 *
 * @param props.team - The team to put them in.
 * @param props.userId - The member to add.
 */
export function AddMemberToTeam({ team, userId }: Readonly<MemberTeamActionProps>) {
  const queryClient = useQueryClient();
  const organization = useOrganization();

  const add = useMutation({
    mutationFn: () =>
      OrganizationService.addOrganizationTeamMember(organization.selectedId(), team.id, userId),

    onSuccess: async () => {
      akNotify.success(akMT('teamMemberAdded'));

      await Promise.all(
        changedByTeamMembership(organization.selected?.id, team.id).map((queryKey) =>
          queryClient.invalidateQueries({ queryKey })
        )
      );
    },

    onError: unlessRateLimited((error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    }),
  });

  if (add.isPending) {
    return <AkSpinner className="text-primary" aria-label={akMT('loading')} />;
  }

  return (
    <AkIconButton
      onClick={() => add.mutate()}
      title={akMT('addToTeams')}
      aria-label={`${akMT('addToTeams')} ${team.name}`}
      data-test-member-team-add
    >
      <AkIcon name="material-symbols:person-add" />
    </AkIconButton>
  );
}
