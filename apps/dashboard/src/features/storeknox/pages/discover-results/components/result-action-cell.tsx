import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
  StoreknoxService,
  type ApiSkApprovalStatusResponse,
  type ApiSkDiscoveryResult,
} from '@irene/api/services/storeknox';

import { unlessRateLimited } from '@irene/api/utils/errors';
import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkSpinner } from '@irene/ui/ak-spinner';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';
import { akNotify } from '@irene/ui/notify';

import { skApprovalCheckOptions, skDiscoveryKeys } from '@/features/storeknox/queries/discovery';
import { storeknoxKeys } from '@/features/storeknox/queries/inventory';
import { skErrorMessage } from '@/features/storeknox/utils/error-message';
import { useOrganization } from '@/hooks/use-organization';

/* The icon appears under the pointer that added it, so its tooltip waits until the pointer leaves. */
const JUST_ADDED_TOOLTIP_DELAY_MS = 3000;

interface ResultActionCellProps {
  result?: ApiSkDiscoveryResult;
  searchId: string;
}

/** Adds or requests a listing and writes the answer into its approval check, so the row updates without refetching. */
function useAddResult(
  result: ApiSkDiscoveryResult | undefined,
  searchId: string,
  onAdded: () => void
) {
  const queryClient = useQueryClient();
  const docUlid = result?.doc_ulid ?? '';

  return useMutation({
    mutationFn: () =>
      StoreknoxService.addAppToInventory({ doc_ulid: docUlid, app_discovery_query: searchId }),
    onSuccess: (app) => {
      onAdded();

      const answer: ApiSkApprovalStatusResponse = {
        id: app.id,
        approval_status: app.approval_status,
        approval_status_display: app.approval_status_display,
      };

      queryClient.setQueryData(skApprovalCheckOptions(docUlid).queryKey, answer);

      /* An owner's addition joins the inventory and anyone else's joins their requests, so both are refetched. */
      void queryClient.invalidateQueries({ queryKey: storeknoxKeys.apps() });
      void queryClient.invalidateQueries({ queryKey: skDiscoveryKeys.requestedAppsAll() });

      if (app.approval_status === ENUMS.SK_APPROVAL_STATUS.APPROVED) {
        akNotify.success(akMT('storeknox.appAddedToInventory', { appName: result?.title }));
      } else if (app.approval_status === ENUMS.SK_APPROVAL_STATUS.PENDING_APPROVAL) {
        akNotify.success(akMT('storeknox.appRequested', { appName: result?.title }));
      }
    },
    onError: unlessRateLimited((error) => akNotify.error(skErrorMessage(error))),
  });
}

/**
 * A search result's action: add or request the app, or mark it as already added or requested.
 * Each row checks its listing's approval status; a 404 there means neither, so the button shows.
 *
 * @param props.result - Absent while its row loads.
 */
export function ResultActionCell({ result, searchId }: Readonly<ResultActionCellProps>) {
  const { isOwner } = useOrganization();
  const [justAdded, setJustAdded] = useState(false);
  const docUlid = result?.doc_ulid ?? '';

  const check = useQuery({ ...skApprovalCheckOptions(docUlid), enabled: Boolean(docUlid) });
  const add = useAddResult(result, searchId, () => setJustAdded(true));

  if (!result) {
    return <AkSkeleton width="30px" height="30px" className="mx-auto" />;
  }

  /* A listing without a ulid cannot be checked or added; irene renders nothing, and the disabled check would otherwise stay pending. */
  if (!docUlid) {
    return null;
  }

  if (check.isPending) {
    return <AkSkeleton width="30px" height="30px" className="mx-auto" />;
  }

  if (check.data) {
    const isApproved = check.data.approval_status === ENUMS.SK_APPROVAL_STATUS.APPROVED;

    const label = isApproved
      ? akMT('storeknox.appAlreadyExists')
      : akMT('storeknox.appAlreadyRequested');

    return (
      <div className="flex justify-center">
        <AkTooltip
          side="bottom"
          color="light"
          arrow
          delayDuration={justAdded ? JUST_ADDED_TOOLTIP_DELAY_MS : 0}
          title={
            <AkTypography color="inherit" className="w-45 p-1.5 whitespace-normal">
              {label}
            </AkTypography>
          }
        >
          <span
            role="img"
            aria-label={label}
            tabIndex={0}
            onPointerLeave={() => setJustAdded(false)}
            className={cn(
              'inline-flex rounded-sm p-1.5',
              isApproved
                ? 'bg-success-surface text-success'
                : 'bg-warning-surface text-warning-strong'
            )}
            data-test-sk-discovery-result-state={isApproved ? 'added' : 'requested'}
          >
            <AkIcon
              name={isApproved ? 'material-symbols:inventory-2' : 'material-symbols:schedule-send'}
              className="size-4"
            />
          </span>
        </AkTooltip>
      </div>
    );
  }

  if (add.isPending) {
    return <AkSpinner className="mx-auto size-4" />;
  }

  return (
    <div className="flex justify-center">
      <AkIconButton
        aria-label={isOwner() ? akMT('storeknox.addToInventory') : akMT('storeknox.sendRequest')}
        onClick={() => add.mutate()}
      >
        <AkIcon name={isOwner() ? 'material-symbols:add-box' : 'material-symbols:send'} />
      </AkIconButton>
    </div>
  );
}
