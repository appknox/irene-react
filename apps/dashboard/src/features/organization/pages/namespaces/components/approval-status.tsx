import { Fragment } from 'react';

import { formatRelativeTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkChip } from '@irene/ui/ak-chip';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkTypography } from '@irene/ui/ak-typography';

import { MemberName } from './member-name';

interface ApprovalStatusProps {
  isApproved: boolean;
  approvedOn: string | null;
  approvedBy: number | null;
  isOwner: boolean;
  isApproving: boolean;
  onApprove: () => void;
  onReject: () => void;
}

/**
 * Whether the namespace was approved, or the controls to decide it.
 *
 * An owner decides; anyone else is told the request is still open.
 *
 * @param props.isApproved - Whether it has been approved already.
 * @param props.approvedOn - When it was approved.
 * @param props.approvedBy - The member who approved it.
 * @param props.isOwner - Whether this account may decide.
 * @param props.isApproving - Whether this row's approval is under way.
 * @param props.onApprove - Called to approve it.
 * @param props.onReject - Called to ask for the rejection to be confirmed.
 */
export function ApprovalStatus({
  isApproved,
  approvedOn,
  approvedBy,
  isOwner,
  isApproving,
  onApprove,
  onReject,
}: Readonly<ApprovalStatusProps>) {
  if (isApproved) {
    return (
      <div className="flex flex-wrap items-center gap-x-1">
        <AkTypography tag="span" color="textSecondary" data-test-namespace-approved-on>
          {formatRelativeTime(approvedOn)}
        </AkTypography>

        <MemberName userId={approvedBy} />
      </div>
    );
  }

  if (!isOwner) {
    return (
      <AkChip
        label={akMT('chipStatus.pending')}
        color="warn"
        size="small"
        variant="semi-filled"
        data-test-namespace-pending
      />
    );
  }

  return (
    <Fragment>
      <AkIconButton
        variant="outlined"
        size="small"
        className="mr-1"
        disabled={isApproving}
        onClick={onApprove}
        aria-label={akMT('approve')}
        title={akMT('approve')}
        data-test-namespace-approve
      >
        <AkIcon name="material-symbols:check" className="text-success" />
      </AkIconButton>

      <AkIconButton
        variant="outlined"
        size="small"
        onClick={onReject}
        aria-label={akMT('reject')}
        title={akMT('reject')}
        data-test-namespace-reject
      >
        <AkIcon name="material-symbols:close" className="text-danger" />
      </AkIconButton>
    </Fragment>
  );
}
