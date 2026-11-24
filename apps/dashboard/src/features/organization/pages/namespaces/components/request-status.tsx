import { formatRelativeTime } from '@irene/translations/date-time';
import { AkTypography } from '@irene/ui/ak-typography';

import { MemberName } from './member-name';

interface RequestStatusProps {
  createdOn: string;
  requestedBy: number | null;
}

/**
 * When the namespace was asked for, and who asked for it.
 *
 * @param props.createdOn - When the request was made.
 * @param props.requestedBy - The member who made it.
 */
export function RequestStatus({ createdOn, requestedBy }: Readonly<RequestStatusProps>) {
  return (
    <div className="flex flex-wrap items-center gap-x-1">
      <AkTypography tag="span" color="textSecondary" data-test-namespace-requested-on>
        {formatRelativeTime(createdOn)}
      </AkTypography>

      <MemberName userId={requestedBy} />
    </div>
  );
}
