import type { ApiOrganizationTeam } from '@irene/api/services/organization';
import { akMT } from '@irene/translations/intl';
import { AkAppbar } from '@irene/ui/ak-appbar';
import { AkButton } from '@irene/ui/ak-button';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';

import { DeleteTeam } from './delete-team';
import { TeamInvitationList } from './team-invitation-list';
import { TeamMemberList } from './team-member-list';
import { TeamProjectList } from './team-project-list';

interface TeamInfoProps {
  team: ApiOrganizationTeam;
  isAdmin: boolean;
  onAction: (action: 'rename' | 'add-members' | 'add-projects' | 'invite') => void;
  onDeleted: () => void;
}

interface TeamCountProps {
  label: string;
  value: number;
  testId: string;
}

/**
 * One of the counts shown at the head of the drawer.
 *
 * @param props.label - What is being counted.
 * @param props.value - How many there are.
 * @param props.testId - Names the value for a test.
 */
function TeamCount({ label, value, testId }: Readonly<TeamCountProps>) {
  return (
    <div className="flex flex-col gap-1">
      <AkTypography variant="subtitle2">{label}</AkTypography>

      <AkTypography data-test-team-count={testId}>{value}</AkTypography>
    </div>
  );
}

/**
 * A team as the drawer shows it: what it holds, and everything in it.
 *
 * The head stays while the lists under it scroll, as irene's does, and an
 * administrator alone sees the members, the invitations and the way to remove
 * the team.
 *
 * @param props.team - The team being shown.
 * @param props.isAdmin - Whether this account administers the organization.
 * @param props.onAction - Opens one of the panes that act on the team.
 * @param props.onDeleted - Called once the team is gone.
 */
export function TeamInfo({ team, isAdmin, onAction, onDeleted }: Readonly<TeamInfoProps>) {
  return (
    /*
      Fills what the drawer's header leaves, and may shrink below its own
      content, so what scrolls inside it scrolls rather than pushing the
      footer past the bottom of the panel.
    */
    <div className="flex min-h-0 flex-1 flex-col" data-test-team-info>
      {/*
        irene draws this as a bar: the subtle surface, a rule under it and a
        soft shadow over what scrolls beneath, with its own padding rather than
        the bar's own gutter.
      */}
      <AkAppbar
        color="light"
        gutter={false}
        className="shrink-0 flex-col items-stretch gap-3.5 p-5.25 shadow-3"
      >
        <div className="flex items-center justify-between gap-3.5">
          <AkTypography variant="h5" data-test-team-info-name>
            {team.name}
          </AkTypography>

          {isAdmin && (
            <AkButton
              variant="text"
              onClick={() => onAction('rename')}
              data-test-team-info-rename
            >
              <AkIcon name="material-symbols:edit" />

              {akMT('editTeamName')}
            </AkButton>
          )}
        </div>

        <div className="flex items-center gap-7">
          <TeamCount
            label={akMT('totalProjects')}
            value={team.projects_count}
            testId="projects"
          />

          <TeamCount label={akMT('totalUsers')} value={team.members_count} testId="users" />
        </div>
      </AkAppbar>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex flex-col gap-10.5 p-5.25">
          <TeamProjectList
            team={team}
            isAdmin={isAdmin}
            onAddProjects={() => onAction('add-projects')}
          />

          {isAdmin && (
            <TeamMemberList
              team={team}
              isAdmin={isAdmin}
              onAddMembers={() => onAction('add-members')}
            />
          )}

          {isAdmin && (
            <TeamInvitationList
              team={team}
              isAdmin={isAdmin}
              onInvite={() => onAction('invite')}
            />
          )}
        </div>

        {isAdmin && (
          <div>
            <AkDivider />

            <div className="p-5.25">
              <DeleteTeam team={team} onDeleted={onDeleted} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
