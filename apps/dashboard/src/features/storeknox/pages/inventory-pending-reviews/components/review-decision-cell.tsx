import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  StoreknoxService,
  type ApiSkApp,
  type ApiSkApprovalStatus,
} from '@irene/api/services/storeknox';

import { unlessRateLimited } from '@irene/api/utils/errors';
import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkSpinner } from '@irene/ui/ak-spinner';
import { akNotify } from '@irene/ui/notify';

import { storeknoxKeys } from '@/features/storeknox/queries/inventory';
import { skErrorMessage } from '@/features/storeknox/utils/error-message';

/**
 * The owner's approve and reject buttons for a pending app. The lists are refetched after either,
 * while the rows already shown stay in place, as irene's `singleUpdate` keeps them.
 *
 * @param props.app - Absent while its row loads.
 */
export function ReviewDecisionCell({ app }: Readonly<{ app?: ApiSkApp }>) {
  const queryClient = useQueryClient();

  const decide = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ApiSkApprovalStatus }) =>
      StoreknoxService.updateApprovalStatus(id, status),
    onSuccess: (_, { status }) => {
      akNotify.success(
        status === ENUMS.SK_APPROVAL_STATUS.APPROVED
          ? akMT('storeknox.appAddedToInventory', { appName: app?.app_metadata.title })
          : akMT('storeknox.appRejected', { appName: app?.app_metadata.title })
      );

      /* Returned so the spinner stays until the lists drop this app, and a second click cannot reach the server. */
      return queryClient.invalidateQueries({ queryKey: storeknoxKeys.apps() });
    },
    onError: unlessRateLimited((error) => akNotify.error(skErrorMessage(error))),
  });

  if (!app) {
    return <AkSkeleton width="50px" height="30px" className="mx-auto" />;
  }

  if (app.approval_status !== ENUMS.SK_APPROVAL_STATUS.PENDING_APPROVAL) {
    return null;
  }

  if (decide.isPending) {
    return <AkSpinner className="mx-auto" />;
  }

  return (
    <div className="flex justify-center gap-2">
      <AkIconButton
        variant="outlined"
        aria-label={akMT('approve')}
        onClick={() => decide.mutate({ id: app.id, status: ENUMS.SK_APPROVAL_STATUS.APPROVED })}
      >
        <AkIcon name="material-symbols:done" className="text-success" />
      </AkIconButton>

      <AkIconButton
        variant="outlined"
        aria-label={akMT('reject')}
        onClick={() => decide.mutate({ id: app.id, status: ENUMS.SK_APPROVAL_STATUS.REJECTED })}
      >
        <AkIcon name="material-symbols:close" className="text-danger" />
      </AkIconButton>
    </div>
  );
}
