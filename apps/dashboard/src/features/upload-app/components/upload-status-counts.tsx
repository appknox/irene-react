import {
  getUploadStatusDisplayProps,
  type UploadOutcome,
  type UploadOutcomeCounts,
} from '@/features/upload-app/utils';

import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';

interface UploadStatusCountsProps {
  counts: UploadOutcomeCounts;
}

/** The order the header counts them in. Each is shown as its rows are. */
const COUNTED_OUTCOMES: UploadOutcome[] = ['running', 'completed', 'failed'];

/**
 * How many uploads are running, finished and failed.
 *
 * @param props.counts - How many uploads fall under each.
 */
export function UploadStatusCounts({ counts }: Readonly<UploadStatusCountsProps>) {
  return (
    <div className="flex items-center gap-3.5">
      {COUNTED_OUTCOMES.map((outcome) => {
        const display = getUploadStatusDisplayProps(outcome);

        return (
          <span key={outcome} className="flex items-center gap-1" data-test-upload-status-count>
            <AkIcon name={display.icon} className={cn('size-4', display.color)} />

            <AkTypography variant="body2">{String(counts[outcome]).padStart(2, '0')}</AkTypography>
          </span>
        );
      })}
    </div>
  );
}
