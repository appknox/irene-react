import type { ApiOrganizationTeam } from '@irene/api/services/organization';
import { akMT } from '@irene/translations/intl';
import { AkTypography } from '@irene/ui/ak-typography';

interface TeamOverviewProps {
  team: ApiOrganizationTeam;
  onOpen: () => void;
}

/**
 * One team in the list: its name, and how much is in it.
 *
 * The whole card opens the team, as irene's does. It is a button inside the
 * list item rather than the item itself, so it is reached by the keyboard and
 * announced as something that can be pressed.
 *
 * @param props.team - The team to show.
 * @param props.onOpen - Called to open the team's details.
 */
export function TeamOverview({ team, onOpen }: Readonly<TeamOverviewProps>) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="
          flex w-full cursor-pointer flex-col items-start rounded-xs border border-border
          bg-background p-3.5 text-left
          hover:bg-hover-light
        "
        data-test-team-overview
      >
        <AkTypography variant="h5" color="primary" className="mb-1.75" data-test-team-name>
          {team.name}
        </AkTypography>

        <div className="flex gap-3.5">
          <AkTypography tag="span" variant="body2" color="textSecondary" className="uppercase" data-test-team-members>
            {akMT('users')} <strong>{team.members_count}</strong>
          </AkTypography>

          <AkTypography tag="span" variant="body2" color="textSecondary" className="uppercase" data-test-team-projects>
            {akMT('projects')} <strong>{team.projects_count}</strong>
          </AkTypography>
        </div>
      </button>
    </li>
  );
}
