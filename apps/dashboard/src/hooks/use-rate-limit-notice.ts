import { useEffect, useRef } from 'react';
import { useStore } from 'zustand';

import { formatWaitTime, rateLimitStore } from '@irene/api/stores/rate-limit';
import { akMT } from '@irene/translations/intl';
import { akNotify } from '@irene/ui/notify';

/* One toast for the whole wait, replaced as the clock ticks rather than stacked. */
const NOTICE_ID = 'irene:api:rate-limit-notice';
const NOTIFICATION_OPTIONS = { id: NOTICE_ID, duration: Infinity };

/**
 * Tells the user their account is rate limited, and counts the wait down.
 *
 * Called once from the root layout. A throttle can start from any request, signed
 * in or not — a throttled sign-in needs the countdown as much as a throttled
 * page does — so this belongs above both layouts rather than inside either.
 */
export function useRateLimitNotice() {
  // Without this the released message fires on the first render, when nothing
  // has been throttled and there is nothing to say.
  const wasThrottled = useRef(false);
  const { isThrottled, secondsRemaining } = useStore(rateLimitStore);

  useEffect(() => {
    if (isThrottled) {
      wasThrottled.current = true;
      const message = `${akMT('rateLimitExceeded')} ${formatWaitTime(secondsRemaining)}`;
      akNotify.error(message, NOTIFICATION_OPTIONS);

      return;
    }

    if (wasThrottled.current) {
      wasThrottled.current = false;
      akNotify.info(akMT('rateLimitLifted'), NOTIFICATION_OPTIONS);
    }
  }, [isThrottled, secondsRemaining]);
}
