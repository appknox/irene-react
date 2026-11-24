import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import type { ApiOrganizationInvitation } from '@irene/api/services/organization';
import { OrganizationService } from '@irene/api/services/organization';
import { getApiErrorMessage, unlessRateLimited } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkConfirmBox } from '@irene/ui/ak-confirm-box';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { akNotify } from '@irene/ui/notify';

import { useOrganization } from '@/hooks/use-organization';
import { organizationKeys } from '@/queries/organization';

interface InvitationActionProps {
  invitation: ApiOrganizationInvitation;

  /** Blurs the page behind the question, for the list inside a team's drawer. */
  blurOverlay?: boolean;
}

/**
 * Sends an invitation again, for one that went unanswered.
 *
 * @param props.invitation - The invitation to send again.
 * @param props.blurOverlay - Blurs what is behind the question, where it is asked over a drawer.
 */
export function ResendInvitation({
  invitation,
  blurOverlay = false,
}: Readonly<InvitationActionProps>) {
  const { selected } = useOrganization();
  const [isAsking, setIsAsking] = useState(false);

  const resend = useMutation({
    mutationFn: () =>
      OrganizationService.resendOrganizationInvitation(Number(selected?.id), invitation.id),

    /* Nothing on screen changes: the same invitation goes out again. */
    onSuccess: () => {
      akNotify.success(akMT('invitationReSent'));
      setIsAsking(false);
    },

    onError: unlessRateLimited((error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    }),
  });

  return (
    <div className="flex justify-center">
      <AkIconButton
        onClick={() => setIsAsking(true)}
        aria-label={`${akMT('resendInvitation')} ${invitation.email}`}
        title={akMT('resendInvitation')}
        data-test-invitation-resend
      >
        <AkIcon name="material-symbols:refresh" />
      </AkIconButton>

      <AkConfirmBox
        isOpen={isAsking}
        description={akMT('confirmBox.resendInvitation')}
        confirmText={akMT('resend')}
        blurOverlay={blurOverlay}
        isWorking={resend.isPending}
        onConfirm={() => resend.mutate()}
        onCancel={() => setIsAsking(false)}
      />
    </div>
  );
}

/**
 * Withdraws an invitation.
 *
 * @param props.invitation - The invitation to withdraw.
 * @param props.blurOverlay - Blurs what is behind the question, where it is asked over a drawer.
 */
export function DeleteInvitation({
  invitation,
  blurOverlay = false,
}: Readonly<InvitationActionProps>) {
  const queryClient = useQueryClient();
  const { selected } = useOrganization();
  const [isAsking, setIsAsking] = useState(false);

  const remove = useMutation({
    mutationFn: () =>
      OrganizationService.deleteOrganizationInvitation(Number(selected?.id), invitation.id),

    onSuccess: async () => {
      akNotify.success(akMT('invitationDeleted'));
      setIsAsking(false);

      /* It leaves the list it was in; the members beside it are unaffected. */
      await queryClient.invalidateQueries({
        queryKey: organizationKeys.invitationsList(selected?.id),
      });
    },

    onError: unlessRateLimited((error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    }),
  });

  return (
    <div className="flex justify-center">
      <AkIconButton
        onClick={() => setIsAsking(true)}
        aria-label={`${akMT('deleteInvitation')} ${invitation.email}`}
        title={akMT('deleteInvitation')}
        data-test-invitation-delete
      >
        <AkIcon name="material-symbols:delete" />
      </AkIconButton>

      <AkConfirmBox
        isOpen={isAsking}
        description={akMT('confirmBox.deleteInvitation')}
        confirmText={akMT('delete')}
        blurOverlay={blurOverlay}
        isWorking={remove.isPending}
        onConfirm={() => remove.mutate()}
        onCancel={() => setIsAsking(false)}
      />
    </div>
  );
}
