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

describe('the lock a 429 puts on the account', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    rateLimitStore.getState().clearThrottle();
    vi.useRealTimers();
  });

  describe('reading how long the lock lasts', () => {
    it('takes the time the server named', () => {
      rateLimitStore.getState().throttle({ detail: { lock_time: 90 } });

      expect(rateLimitStore.getState().secondsRemaining).toBe(90);
    });

    it('rounds a fractional time up, so the wait is never understated', () => {
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

  describe('counting down', () => {
    it('starts locked for the time the server named', () => {
      rateLimitStore.getState().throttle({ detail: { lock_time: 30 } });

      expect(rateLimitStore.getState()).toMatchObject({
        isThrottled: true,
        secondsRemaining: 30,
        throttledForSeconds: 30,
      });
    });

    it('lifts the lock once the time runs out', () => {
      rateLimitStore.getState().throttle({ detail: { lock_time: 5 } });

      vi.advanceTimersByTime(5000);

      expect(rateLimitStore.getState().isThrottled).toBe(false);
    });

    it('counts every second, so the wait reads as a countdown', () => {
      expect(recordCountdown(5, 5000)).toEqual([5, 4, 3, 2, 1, 0]);
    });

    it('ignores a second refusal, so a burst of requests cannot restart the clock', () => {
      rateLimitStore.getState().throttle({ detail: { lock_time: 30 } });

      vi.advanceTimersByTime(10_000);
      rateLimitStore.getState().throttle({ detail: { lock_time: 30 } });

      expect(rateLimitStore.getState().secondsRemaining).toBeLessThan(30);
    });

    it('stops ticking once cleared', () => {
      rateLimitStore.getState().throttle({ detail: { lock_time: 30 } });
      rateLimitStore.getState().clearThrottle();

      const stop = rateLimitStore.subscribe(() => expect.unreachable('the clock kept running'));

      vi.advanceTimersByTime(60_000);
      stop();

      expect(rateLimitStore.getState().isThrottled).toBe(false);
    });

    it('can be locked again after one lock has lifted', () => {
      rateLimitStore.getState().throttle({ detail: { lock_time: 5 } });

      vi.advanceTimersByTime(5000);
      rateLimitStore.getState().throttle({ detail: { lock_time: 20 } });

      expect(rateLimitStore.getState()).toMatchObject({ isThrottled: true, secondsRemaining: 20 });
    });
  });

  describe('the requests a lock leaves alone', () => {
    it('exempts an upload, which is slow by nature', () => {
      expect(isRateLimitExempt('api/upload_app')).toBe(true);
    });

    it('does not exempt an ordinary request', () => {
      expect(isRateLimitExempt('api/v2/projects')).toBe(false);
    });

    it('does not exempt a request with no URL to judge', () => {
      expect(isRateLimitExempt(undefined)).toBe(false);
    });
  });

  describe('saying the wait out loud', () => {
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
