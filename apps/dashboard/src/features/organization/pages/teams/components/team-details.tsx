import { useQuery } from '@tanstack/react-query';
import { Fragment, useState } from 'react';

import type { ApiOrganizationTeam } from '@irene/api/services/organization';
import { akMT } from '@irene/translations/intl';
import { AkAppbar } from '@irene/ui/ak-appbar';
import { AkButton } from '@irene/ui/ak-button';
import { AkDrawer, AkDrawerContent, AkDrawerHeader } from '@irene/ui/ak-drawer';
import { AkIcon } from '@irene/ui/ak-icon';

import { useOrganization } from '@/hooks/use-organization';
import { organizationTeamOptions } from '@/queries/organization';

import { AddTeamMembers } from './add-team-members';
import { AddTeamProjects } from './add-team-projects';
import { EditTeamName } from './edit-team-name';
import { InviteTeamMembers } from './invite-team-members';
import { TeamInfo } from './team-info';

/** What the drawer can be doing to a team instead of showing it. */
export type TeamAction = 'rename' | 'add-members' | 'add-projects' | 'invite';

interface TeamDetailsProps {
  team: ApiOrganizationTeam | null;
  isAdmin: boolean;
  onClose: () => void;
}

/**
 * One team, opened from its card in the list.
 *
 * It holds a team's details and the panes that act on it. A pane replaces the
 * details rather than stacking over them, as irene's does, so the way back is
 * the team's own name at the top.
 *
 * @param props.team - The team to show, as the list has it, absent while the drawer is closed.
 * It opens on that straight away and reads the team again behind it, so a count changed by
 * something done here lands without the drawer ever being empty.
 * @param props.isAdmin - Whether this account administers the organization.
 * @param props.onClose - Called to close the drawer.
 */
export function TeamDetails({ team: openedTeam, isAdmin, onClose }: Readonly<TeamDetailsProps>) {
  const { selected } = useOrganization();

  /* The pane is held with the team it was opened from, so opening another shows that team. */
  const [openPane, setOpenPane] = useState<{ teamId: number; action: TeamAction } | null>(null);

  const teamId = openedTeam?.id ?? null;

  /*
    The list's own copy stands in until this answers, so the drawer has
    something to draw from the moment it opens.
  */
  const { data: readTeam } = useQuery({
    ...organizationTeamOptions(selected?.id, teamId),
    placeholderData: openedTeam ?? undefined,
  });

  const team = readTeam ?? openedTeam;

  const action = openPane?.teamId === teamId ? openPane.action : null;

  const openAction = (next: TeamAction) =>
    setOpenPane(teamId === null ? null : { teamId, action: next });

  const leaveAction = () => setOpenPane(null);

  const close = () => {
    setOpenPane(null);
    onClose();
  };

  return (
    <AkDrawer open={teamId !== null} onOpenChange={(open) => !open && close()}>
      <AkDrawerContent className="w-162.5" data-test-team-details>
        <AkDrawerHeader title={akMT('teamDetails')} closeLabel={akMT('close')} />

        {team && action === null && (
          <TeamInfo team={team} isAdmin={isAdmin} onAction={openAction} onDeleted={close} />
        )}

        {team && action !== null && (
          <Fragment>
            {/*
              The team's name is the way back, in a bar of its own above the
              pane, as irene puts it: the pane replaces the details rather than
              stacking over them, so the name says what is being returned to.
            */}
            <AkAppbar color="light" className="shrink-0">
              <AkButton
                variant="text"
                onClick={leaveAction}
                leftIcon={<AkIcon name="material-symbols:arrow-back" />}
                className="text-lg font-bold hover:no-underline"
                data-test-team-action-title
              >
                {team.name}
              </AkButton>
            </AkAppbar>

            {action === 'rename' && <EditTeamName team={team} onDone={leaveAction} />}

            {action === 'add-members' && <AddTeamMembers team={team} onDone={leaveAction} />}

            {action === 'add-projects' && <AddTeamProjects team={team} onDone={leaveAction} />}

            {action === 'invite' && <InviteTeamMembers team={team} onDone={leaveAction} />}
          </Fragment>
        )}
      </AkDrawerContent>
    </AkDrawer>
  );
}
