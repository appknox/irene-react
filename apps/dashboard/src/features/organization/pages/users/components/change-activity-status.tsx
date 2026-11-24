import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Fragment, useState } from 'react';

import type { ApiOrganizationUser } from '@irene/api/services/organization';
import { OrganizationService } from '@irene/api/services/organization';
import { getApiErrorMessage, unlessRateLimited } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkConfirmBox } from '@irene/ui/ak-confirm-box';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { useOrganization } from '@/hooks/use-organization';
import { organizationKeys } from '@/queries/organization';

interface ChangeActivityStatusProps {
  user: ApiOrganizationUser;
}

/**
 * Deactivates a member, or brings a deactivated one back.
 *
 * A deactivated member keeps their place and their teams but cannot sign in,
 * so irene asks before either, naming who it is about.
 *
 * @param props.user - The member whose standing is being changed.
 */
export function ChangeActivityStatus({ user }: Readonly<ChangeActivityStatusProps>) {
  const queryClient = useQueryClient();
  const organization = useOrganization();
  const [isAsking, setIsAsking] = useState(false);

  const isActive = user.is_active;

  const changeStanding = useMutation({
    mutationFn: () =>
      OrganizationService.setOrganizationUserActive(
        organization.selectedId(),
        user.id,
        !isActive
      ),

    onSuccess: async () => {
      akNotify.success(`${isActive ? akMT('deactivated') : akMT('activated')} ${user.username}`);
      setIsAsking(false);

      /* The member is read by the list and by name beside the records that carry their id. */
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: organizationKeys.membersList(organization.selected?.id),
        }),

        queryClient.invalidateQueries({
          queryKey: organizationKeys.user(organization.selected?.id, user.id),
        }),
      ]);
    },

    onError: unlessRateLimited((error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    }),
  });

  return (
    <Fragment>
      <div className="flex flex-col items-start gap-1.75" data-test-change-activity-status>
        <AkTypography>
          {isActive ? akMT('deactivateUserDesc') : akMT('activateUserDesc')}
        </AkTypography>

        <AkButton
          variant="outlined"
          onClick={() => setIsAsking(true)}
          leftIcon={
            <AkIcon
              name={
                isActive
                  ? 'material-symbols:person-off-outline'
                  : 'material-symbols:person-outline'
              }
            />
          }
          data-test-change-activity-status-button
        >
          {isActive ? akMT('deactivateUser') : akMT('activateUser')}
        </AkButton>
      </div>

      <AkConfirmBox
        isOpen={isAsking}
        title={isActive ? akMT('userDeactivateTitle') : akMT('userActivateTitle')}
        confirmText={akMT('confirm')}
        blurOverlay
        isWorking={changeStanding.isPending}
        onConfirm={() => changeStanding.mutate()}
        onCancel={() => setIsAsking(false)}
      >
        <AkTypography align="center" data-test-change-activity-status-question>
          {`${akMT('userActivationChangeMessage')} `}

          <strong>{user.username}</strong>

          {` ${isActive ? akMT('inactive') : akMT('active')}?`}
        </AkTypography>
      </AkConfirmBox>
    </Fragment>
  );
}
