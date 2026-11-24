import { useQuery } from '@tanstack/react-query';
import { Fragment, useState } from 'react';

import type { ApiOrganizationMembership } from '@irene/api/services/organization';
import { akMT } from '@irene/translations/intl';
import { AkAppbar } from '@irene/ui/ak-appbar';
import { AkButton } from '@irene/ui/ak-button';
import { AkDrawer, AkDrawerContent, AkDrawerHeader } from '@irene/ui/ak-drawer';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';

import { useOrganization } from '@/hooks/use-organization';
import { organizationUserOptions } from '@/queries/organization';

import { MemberDetails } from './member-details';
import { MemberTeamList } from './member-team-list';
import { AddMemberToTeam } from './member-team-actions';

interface MemberDrawerProps {
  membership: ApiOrganizationMembership | null;
  onClose: () => void;
}

/**
 * One member of the organization, opened from their row.
 *
 * It holds their details and, behind the control to add them to a team, the
 * teams they are not yet in. That view replaces the details rather than
 * stacking over them, as irene's does, so the way back is the member's own name.
 *
 * @param props.membership - The member to show, absent while the drawer is closed.
 * @param props.onClose - Called to close the drawer.
 */
export function MemberDrawer({ membership, onClose }: Readonly<MemberDrawerProps>) {
  const { selected, me } = useOrganization();

  /* Held with the member it was opened for, so opening another shows their details. */
  const [addingToTeamsFor, setAddingToTeamsFor] = useState<number | null>(null);

  const { data: user } = useQuery(organizationUserOptions(selected?.id, membership?.member ?? null));

  const isAddingToTeams = membership !== null && addingToTeamsFor === membership.member;

  const close = () => {
    setAddingToTeamsFor(null);
    onClose();
  };

  return (
    <AkDrawer open={membership !== null} onOpenChange={(open) => !open && close()}>
      <AkDrawerContent className="w-162.5" data-test-member-drawer>
        <AkDrawerHeader
          title={isAddingToTeams ? akMT('addToTeams') : akMT('userDetails')}
          closeLabel={akMT('close')}
        />

        {membership !== null && !isAddingToTeams && (
          <MemberDetails
            membership={membership}
            onAddToTeams={() => setAddingToTeamsFor(membership.member)}
          />
        )}

        {membership !== null && isAddingToTeams && (
          <Fragment>
            <AkAppbar color="light" className="shrink-0">
              <AkButton
                variant="text"
                color="textPrimary"
                onClick={() => setAddingToTeamsFor(null)}
                leftIcon={<AkIcon name="material-symbols:arrow-back" className="text-primary" />}
                className="hover:no-underline"
                data-test-member-add-to-teams-title
              >
                <AkTypography tag="span" fontWeight="medium">
                  {user?.username ?? ''}
                </AkTypography>

                <AkTypography tag="span">{`(${user?.email ?? ''})`}</AkTypography>
              </AkButton>
            </AkAppbar>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5.25">
              <MemberTeamList
                title={akMT('addToTeams')}
                description={akMT('addToTeamsDesc')}
                userId={membership.member}
                shows="joinable"
                action={
                  me?.is_admin
                    ? (team) => <AddMemberToTeam team={team} userId={membership.member} />
                    : undefined
                }
              />
            </div>
          </Fragment>
        )}
      </AkDrawerContent>
    </AkDrawer>
  );
}
