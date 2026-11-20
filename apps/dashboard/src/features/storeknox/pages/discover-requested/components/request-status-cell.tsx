import { ENUMS } from '@irene/enums';
import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkChip } from '@irene/ui/ak-chip';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiSkRequestedApp } from '@irene/api/services/storeknox';

/** What a decided request reads: the decision, who made it and when. */
function _decision(request: ApiSkRequestedApp) {
  if (request.approval_status === ENUMS.SK_APPROVAL_STATUS.APPROVED) {
    return {
      color: 'success' as const,
      text: akMT('storeknox.approved'),
      by: request.approved_by,
      on: request.approved_on,
    };
  }

  return {
    color: 'error' as const,
    text: akMT('rejected'),
    by: request.rejected_by,
    on: request.rejected_on,
  };
}

/**
 * Where a member's request stands; one neither pending nor approved reads as rejected, as in irene.
 *
 * @param props.request - Absent while its row loads.
 */
export function RequestStatusCell({ request }: Readonly<{ request?: ApiSkRequestedApp }>) {
  if (!request) {
    return <AkSkeleton width="170px" height="32px" />;
  }

  if (request.approval_status === ENUMS.SK_APPROVAL_STATUS.PENDING_APPROVAL) {
    return (
      <AkChip
        variant="semi-filled"
        color="warn"
        label={akMT('storeknox.waitingForApproval')}
        icon={<AkIcon name="material-symbols:schedule-send" />}
      />
    );
  }

  const decision = _decision(request);
  const decidedOn = formatDateTime(decision.on, 'longDateTime');

  return (
    <div className="flex flex-col justify-center" data-test-sk-request-decision>
      <AkTypography color={decision.color}>{decision.text}</AkTypography>

      <div className="flex items-center gap-1">
        <AkTypography>
          <AkMessageTranslate id="by" /> {decision.by}
        </AkTypography>

        <AkTooltip
          side="bottom"
          color="light"
          arrow
          title={
            <span className="flex items-center gap-1">
              <AkIcon name="material-symbols:check-circle" className="size-4" />

              <AkTypography tag="span" color="inherit">
                {decidedOn}
              </AkTypography>
            </span>
          }
        >
          <span role="img" aria-label={decidedOn} tabIndex={0} className="inline-flex">
            <AkIcon name="material-symbols:info" className="size-3 text-neutral-300" />
          </span>
        </AkTooltip>
      </div>
    </div>
  );
}
