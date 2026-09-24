import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { formatWaitTime, rateLimitStore } from '@irene/api/stores/rate-limit';
import { akMT } from '@irene/translations/intl';
import { akNotify } from '@irene/ui/notify';

import { useRateLimitNotice } from '@/hooks/use-rate-limit-notice';

/** Locks the account as a 429 would, from outside React. */
const lockFor = (seconds: number) =>
  act(() => rateLimitStore.getState().throttle({ detail: { lock_time: seconds } }));

/** Lets the clock run, so the countdown reaches its next announcement. */
const waitSeconds = (seconds: number) => act(() => vi.advanceTimersByTime(seconds * 1000));

/** What the user was last told, ignoring which toast carried it. */
const lastMessage = (notify: typeof akNotify.error) =>
  vi.mocked(notify).mock.calls.at(-1)?.[0] as string | undefined;

describe('useRateLimitNotice', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(akNotify, 'error').mockReturnValue('');
    vi.spyOn(akNotify, 'info').mockReturnValue('');
  });

  afterEach(() => {
    // Inside act: the hook is still mounted here, and lifting the lock is a
    // state update it will react to.
    act(() => rateLimitStore.getState().clearThrottle());

    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders no notification while no rate limit is running', () => {
    renderHook(() => useRateLimitNotice());

    expect(akNotify.error).not.toHaveBeenCalled();
    expect(akNotify.info).not.toHaveBeenCalled();
  });

  it('renders the remaining seconds as soon as the rate limit starts', () => {
    renderHook(() => useRateLimitNotice());

    lockFor(90);

    expect(lastMessage(akNotify.error)).toBe(`${akMT('rateLimitExceeded')} ${formatWaitTime(90)}`);
  });

  it('updates the remaining seconds each tick', () => {
    renderHook(() => useRateLimitNotice());

    lockFor(120);
    waitSeconds(20);

    expect(lastMessage(akNotify.error)).toBe(`${akMT('rateLimitExceeded')} ${formatWaitTime(100)}`);
  });

  it('updates one notification rather than adding one per tick', () => {
    renderHook(() => useRateLimitNotice());

    lockFor(120);
    waitSeconds(40);

    const ids = vi.mocked(akNotify.error).mock.calls.map(([, options]) => options?.id);

    expect(new Set(ids).size).toBe(1);
  });

  it('keeps the notification on screen until the rate limit lifts', () => {
    renderHook(() => useRateLimitNotice());

    lockFor(90);

    expect(vi.mocked(akNotify.error).mock.calls.at(-1)?.[1]).toMatchObject({
      duration: Infinity,
    });
  });

  it('renders the rate-limit-lifted message once the wait ends', () => {
    renderHook(() => useRateLimitNotice());

    lockFor(5);
    waitSeconds(5);

    expect(lastMessage(akNotify.info)).toBe(akMT('rateLimitLifted'));
  });

  it('renders a new countdown for a second rate limit', () => {
    renderHook(() => useRateLimitNotice());

    lockFor(5);
    waitSeconds(5);
    lockFor(45);

    expect(lastMessage(akNotify.error)).toBe(`${akMT('rateLimitExceeded')} ${formatWaitTime(45)}`);
  });
});
