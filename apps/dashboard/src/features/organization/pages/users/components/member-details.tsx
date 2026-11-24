import { useQuery } from '@tanstack/react-query';
import { Fragment, type ReactNode } from 'react';

import type { ApiOrganizationMembership } from '@irene/api/services/organization';
import { DateTimeFormat, formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkTypography } from '@irene/ui/ak-typography';

import { useOrganization } from '@/hooks/use-organization';
import { organizationUserOptions } from '@/queries/organization';

import { ChangeActivityStatus } from './change-activity-status';
import { MemberRole } from './member-role';
import { MemberTeamList } from './member-team-list';
import { RemoveMemberFromTeam } from './member-team-actions';

interface MemberDetailsProps {
  membership: ApiOrganizationMembership;
  onAddToTeams: () => void;
}

interface MemberFactProps {
  label: string;
  children: ReactNode;
}

/**
 * One line of the member's details: what it is, and what it says.
 *
 * @param props.label - What the line is about.
 * @param props.children - What it says, which may be a control rather than text.
 */
function MemberFact({ label, children }: Readonly<MemberFactProps>) {
  return (
    <div className="flex w-full items-center">
      <AkTypography tag="span" color="textSecondary" className="w-4/12" data-test-member-fact-label>
        {label}
      </AkTypography>

      <div className="w-8/12" data-test-member-fact-value>
        {children}
      </div>
    </div>
  );
}

/**
 * One member of the organization: who they are, what they may do, and the
 * teams they are in.
 *
 * An owner also finds the way to deactivate them here, which irene keeps to an
 * owner alone.
 *
 * @param props.membership - The member's place in the organization, as the list has it.
 * @param props.onAddToTeams - Opens the view for putting them in another team.
 */
export function MemberDetails({ membership, onAddToTeams }: Readonly<MemberDetailsProps>) {
  const { selected, me } = useOrganization();
  const { data: user } = useQuery(organizationUserOptions(selected?.id, membership.member));

  const isAdmin = Boolean(me?.is_admin);
  const isOwner = Boolean(me?.is_owner);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto" data-test-member-details>
      {/*
        irene sets this block off from the teams below it with a rule and a
        shadow, and lays the details against the control at a 9-to-3 split.
      */}
      <div className="flex shrink-0 items-start gap-3.5 border-b border-divider-strong p-5.25 shadow-3">
        <div className="flex w-9/12 flex-col">
          <MemberFact label={akMT('user')}>
            <AkTypography variant="h6" data-test-member-username>
              {user?.username ?? ''}
            </AkTypography>
          </MemberFact>

          <AkDivider color="light" className="my-2.25" />

          <MemberFact label={akMT('emailId')}>
            <AkTypography variant="h6" data-test-member-email>
              {user?.email ?? ''}
            </AkTypography>
          </MemberFact>

          <AkDivider color="light" className="my-2.25" />

          <MemberFact label={akMT('role')}>
            <MemberRole member={membership} align="start" />
          </MemberFact>

          <AkDivider color="light" className="my-2.25" />

          <MemberFact label={akMT('lastLoggedIn')}>
            <AkTypography variant="h6" data-test-member-last-login>
              {membership.last_logged_in
                ? formatDateTime(membership.last_logged_in, DateTimeFormat.ll)
                : akMT('never')}
            </AkTypography>
          </MemberFact>
        </div>

        {/* irene closes this to a deactivated member: they are retired, not moved about. */}
        <div className="flex w-3/12 justify-end">
          <AkButton
            disabled={user?.is_active === false}
            onClick={onAddToTeams}
            data-test-member-add-to-teams
          >
            {akMT('addToTeams')}
          </AkButton>
        </div>
      </div>

      <div className="p-5.25">
        <MemberTeamList
          title={akMT('team')}
          description={akMT('usersTeamDesc')}
          userId={membership.member}
          shows="joined"
          action={
            isAdmin
              ? (team) => <RemoveMemberFromTeam team={team} userId={membership.member} />
              : undefined
          }
        />
      </div>

      {isOwner && user && (
        <Fragment>
          <AkDivider />

          <div className="p-5.25">
            <ChangeActivityStatus user={user} />
          </div>
        </Fragment>
      )}
    </div>
  );
}
