import { Fragment } from 'react';

import { AkDivider } from '@irene/ui/ak-divider';
import { AkSkeleton } from '@irene/ui/ak-skeleton';

/** How many rows stand in while the list loads, which is what the panel usually holds. */
const PLACEHOLDER_ROWS = 5;

/** The message lines a row stands in with, narrowing as a paragraph does. */
const LINE_WIDTHS = ['80%', '60%'];

/**
 * Stands in for the notification list while it loads.
 *
 * Laid out as the rows it replaces — message, timestamp and the unread dot — so
 * the panel does not resize or reflow once they arrive.
 */
export function NotificationsLoadingSkeleton() {
  return (
    <div data-test-notifications-loading>
      {Array.from({ length: PLACEHOLDER_ROWS }, (_row, index) => (
        <Fragment key={index}>
          {index > 0 && <AkDivider />}

          <div className="flex w-full flex-row gap-1.75 p-3.5">
            <div className="flex flex-auto flex-col gap-1.5">
              {LINE_WIDTHS.map((width) => (
                <AkSkeleton key={width} width={width} height="0.9rem" />
              ))}

              <AkSkeleton width="28%" height="0.75rem" />
            </div>

            <AkSkeleton variant="circular" width="0.5rem" height="0.5rem" className="m-1.75" />
          </div>
        </Fragment>
      ))}
    </div>
  );
}
