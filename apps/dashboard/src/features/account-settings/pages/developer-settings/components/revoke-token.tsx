import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  AkModal,
  AkModalBody,
  AkModalClose,
  AkModalContent,
  AkModalFooter,
  AkModalHeader,
  AkModalTrigger,
} from '@irene/ui/ak-modal';

import { PersonalTokenService, type ApiPersonalToken } from '@irene/api/services/personal-token';
import { unlessRateLimited } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { getFirstJsonApiError } from '@/features/account-settings/pages/developer-settings/utils';
import { personalTokenKeys } from '@/features/account-settings/queries/personal-token';

/**
 * Revokes a token once the user confirms, since a revoked token cannot be
 * brought back and anything calling the API with it stops working.
 *
 * The modal stays open while the request runs and closes once the list has
 * reloaded, as irene's confirm box does.
 *
 * @param props.token - The token to revoke.
 */
export function RevokeToken({ token }: Readonly<{ token: ApiPersonalToken }>) {
  const queryClient = useQueryClient();

  const revoke = useMutation({
    mutationFn: () => PersonalTokenService.revokePersonalToken(token.id),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: personalTokenKeys.list() });
      akNotify.success(akMT('personalTokenRevoked'));
    },

    onError: unlessRateLimited((error) => {
      akNotify.error(getFirstJsonApiError(error)?.detail ?? akMT('somethingWentWrong'));
    }),
  });

  return (
    <AkModal>
      <AkModalTrigger asChild>
        <AkIconButton
          size="small"
          aria-label={`${akMT('delete')} ${token.name}`}
          className="text-danger"
          data-test-personal-token-delete
        >
          <AkIcon name="material-symbols:delete" />
        </AkIconButton>
      </AkModalTrigger>

      <AkModalContent aria-describedby={undefined}>
        <AkModalHeader title={akMT('confirm')} closeLabel={akMT('close')} />

        <AkModalBody>
          <AkTypography>{akMT('confirmBox.revokePersonalToken')}</AkTypography>
        </AkModalBody>

        <AkModalFooter className="flex-row items-center justify-end gap-2.5 px-5.25 py-3.5">
          <AkButton type="button" loading={revoke.isPending} onClick={() => revoke.mutate()}>
            {akMT('delete')}
          </AkButton>

          <AkModalClose asChild>
            <AkButton type="button" variant="outlined" color="neutral" disabled={revoke.isPending}>
              {akMT('cancel')}
            </AkButton>
          </AkModalClose>
        </AkModalFooter>
      </AkModalContent>
    </AkModal>
  );
}
