import { useQuery } from '@tanstack/react-query';

import { akMT } from '@irene/translations/intl';
import { AkRouterLink } from '@irene/ui/ak-router-link';
import { AkTypography } from '@irene/ui/ak-typography';

import { ORGANIZATION_TABS } from '@/features/organization/layout/tabs';
import { useOrganization } from '@/hooks/use-organization';
import { organizationTeamOptions } from '@/queries/organization';

interface InviteTypeProps {
  teamId: number | null;
}

/**
 * What an invitation is into: a named team, or the organization at large.
 *
 * An invitation carries only the team's id, so the team behind it is read
 * here. The name links into the teams tab searched for that team, which is
 * how the team is reached from the invitation. It is a router link carrying
 * that search, so it switches tab in place as the tabs themselves do.
 *
 * @param props.teamId - The team the invitation is into, absent for one into the organization.
 */
export function InviteType({ teamId }: Readonly<InviteTypeProps>) {
  const { selected } = useOrganization();
  const { data: team } = useQuery(organizationTeamOptions(selected?.id, teamId));

  if (teamId === null) {
    return (
      <AkTypography tag="span" color="textSecondary" data-test-invitation-type>
        {akMT('organization')}
      </AkTypography>
    );
  }

  return (
    <div className="flex items-center gap-1.75" data-test-invitation-type>
      <AkTypography tag="span" color="textSecondary">
        {akMT('team')}
      </AkTypography>

      {team && (
        <AkRouterLink
          color="primary"
          to={ORGANIZATION_TABS.teams}
          search={{ team_query: team.name, team_offset: 0 }}
          data-test-invitation-team-link
        >
          {team.name}
        </AkRouterLink>
      )}
    </div>
  );
}
