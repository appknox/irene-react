import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatWaitTime, isRateLimitExempt, rateLimitStore } from '@irene/api/stores/rate-limit';

/** Starts a lock and reports the seconds the store settles on after each step. */
function recordCountdown(lockSeconds: number, runForMs: number): number[] {
  const seen: number[] = [];
  const stop = rateLimitStore.subscribe((state) => seen.push(state.secondsRemaining));

  rateLimitStore.getState().throttle({ detail: { lock_time: lockSeconds } });
  vi.advanceTimersByTime(runForMs);

  stop();

  return seen;
}

describe('rateLimitStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    rateLimitStore.getState().clearThrottle();
    vi.useRealTimers();
  });

  describe('reading the wait from the response', () => {
    it('takes the seconds the body names', () => {
      rateLimitStore.getState().throttle({ detail: { lock_time: 90 } });

      expect(rateLimitStore.getState().secondsRemaining).toBe(90);
    });

    it('rounds a fractional wait up', () => {
      rateLimitStore.getState().throttle({ detail: { lock_time: 30.2 } });

      expect(rateLimitStore.getState().secondsRemaining).toBe(31);
    });

    it.each([{}, { detail: {} }, { detail: { lock_time: 0 } }, 'locked out', null])(
      'falls back to a minute when the body says nothing usable: %o',
      (payload) => {
        rateLimitStore.getState().throttle(payload);

        expect(rateLimitStore.getState().secondsRemaining).toBe(60);
      }
    );
  });

  describe('the countdown', () => {
    it('starts with the seconds the body named', () => {
      rateLimitStore.getState().throttle({ detail: { lock_time: 30 } });

      expect(rateLimitStore.getState()).toMatchObject({
        isThrottled: true,
        secondsRemaining: 30,
        throttledForSeconds: 30,
      });
    });

    it('unlocks once the countdown reaches zero', () => {
      rateLimitStore.getState().throttle({ detail: { lock_time: 5 } });

      vi.advanceTimersByTime(5000);

      expect(rateLimitStore.getState().isThrottled).toBe(false);
    });

    it('decrements the remaining seconds each second', () => {
      expect(recordCountdown(5, 5000)).toEqual([5, 4, 3, 2, 1, 0]);
    });

    it('ignores a second 429 while a countdown is running', () => {
      rateLimitStore.getState().throttle({ detail: { lock_time: 30 } });

      vi.advanceTimersByTime(10_000);
      rateLimitStore.getState().throttle({ detail: { lock_time: 30 } });

      expect(rateLimitStore.getState().secondsRemaining).toBeLessThan(30);
    });

    it('stops the countdown on clear', () => {
      rateLimitStore.getState().throttle({ detail: { lock_time: 30 } });
      rateLimitStore.getState().clearThrottle();

      const stop = rateLimitStore.subscribe(() => expect.unreachable('the clock kept running'));

      vi.advanceTimersByTime(60_000);
      stop();

      expect(rateLimitStore.getState().isThrottled).toBe(false);
    });

    it('starts a new countdown once the previous one has ended', () => {
      rateLimitStore.getState().throttle({ detail: { lock_time: 5 } });

      vi.advanceTimersByTime(5000);
      rateLimitStore.getState().throttle({ detail: { lock_time: 20 } });

      expect(rateLimitStore.getState()).toMatchObject({ isThrottled: true, secondsRemaining: 20 });
    });
  });

  describe('the requests the rate limit exempts', () => {
    it('exempts an upload request', () => {
      expect(isRateLimitExempt('api/upload_app')).toBe(true);
    });

    it('does not exempt an ordinary request', () => {
      expect(isRateLimitExempt('api/v2/projects')).toBe(false);
    });

    it('does not exempt a request with no URL', () => {
      expect(isRateLimitExempt(undefined)).toBe(false);
    });
  });

  describe('the wait message', () => {
    it.each([
      [45, '45s'],
      [60, '1m 0s'],
      [90, '1m 30s'],
      [125, '2m 5s'],
    ])('reads %i seconds as %s', (seconds, expected) => {
      expect(formatWaitTime(seconds)).toBe(expected);
    });
  });
});
