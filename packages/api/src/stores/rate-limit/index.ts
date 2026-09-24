import { createStore } from 'zustand/vanilla';

/**
 *
 * The store that manages the rate limit.
 *
 * @interface RateLimitStore
 * @property {boolean} isThrottled - Whether the account is waiting out a 429.
 * @property {number} secondsRemaining - Seconds left to wait.
 * @property {number} throttledForSeconds - Seconds the wait started at, so a caller can show progress.
 * @property {function} throttle - Starts the wait from a 429 body. A wait already running is left alone.
 * @property {function} clearThrottle - Ends the wait, and stops the clock.
 */
interface RateLimitStore {
  isThrottled: boolean;
  secondsRemaining: number;
  throttledForSeconds: number;
  throttle: (payload: unknown) => void;
  clearThrottle: () => void;
}

/** The payload of a rate limit response. */
type RateLimitPayload = { detail?: { lock_time?: unknown } } | null;

/** Seconds to fall back to when the server names no wait. */
const DEFAULT_THROTTLE_SECONDS = 60;

const RATE_LIMIT_EXEMPT_API_ENDPOINTS = ['/upload_app'];
const NOT_THROTTLED = { isThrottled: false, secondsRemaining: 0, throttledForSeconds: 0 };

/*
  The running clock. Kept beside the store rather than in it: subscribers care
  when the seconds change, not when a timer handle is swapped.
*/
let clock: ReturnType<typeof setInterval> | null = null;

/**
 * Reads the wait out of a 429 body.
 *
 * @param payload - The response body.
 * @returns The seconds to wait, falling back when the body names none.
 */
function _readThrottleSeconds(payload: unknown): number {
  const lockTime = (payload as RateLimitPayload)?.detail?.lock_time;
  const lockTimeIsGreaterThanZero = typeof lockTime === 'number' && lockTime > 0;

  return lockTimeIsGreaterThanZero ? Math.ceil(lockTime) : DEFAULT_THROTTLE_SECONDS;
}

/**
 * Whether a request is exempt from rate limiting.
 *
 * @param url - The request's URL.
 * @returns Whether a 429 on this request should be ignored.
 */
export const isRateLimitExempt = (url: string | undefined) =>
  Boolean(url) && RATE_LIMIT_EXEMPT_API_ENDPOINTS.some((path) => url?.includes(path));

/**
 * The wait, as a person would say it.
 *
 * @param seconds - Seconds left to wait.
 * @returns e.g. `2m 30s`, or `45s` under a minute.
 */
export function formatWaitTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

/**
 * How long a throttled account has left to wait.
 *
 * Lives outside React because the 429 that starts it arrives in an axios
 * interceptor, while the countdown is read by components.
 */
export const rateLimitStore = createStore<RateLimitStore>((set, get) => ({
  ...NOT_THROTTLED,

  throttle: (payload) => {
    if (!get().isThrottled) {
      const seconds = _readThrottleSeconds(payload);
      set({ isThrottled: true, secondsRemaining: seconds, throttledForSeconds: seconds });

      // Start the clock
      clock = setInterval(() => {
        const secondsLeft = get().secondsRemaining - 1;

        if (secondsLeft <= 0) {
          get().clearThrottle();
        } else {
          set({ secondsRemaining: secondsLeft });
        }
      }, 1000);
    }
  },

  clearThrottle: () => {
    if (clock !== null) {
      clearInterval(clock);
    }

    clock = null;
    set(NOT_THROTTLED);
  },
}));
