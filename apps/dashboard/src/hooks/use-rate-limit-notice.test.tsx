import { renderHook } from '@testing-library/react';
import { act } from 'react';
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

describe('telling the user their account is rate limited', () => {
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

  it('says nothing to a user who has not been locked out', () => {
    renderHook(() => useRateLimitNotice());

    expect(akNotify.error).not.toHaveBeenCalled();
    expect(akNotify.info).not.toHaveBeenCalled();
  });

  it('names the wait as soon as the lock starts', () => {
    renderHook(() => useRateLimitNotice());

    lockFor(90);

    expect(lastMessage(akNotify.error)).toBe(`${akMT('rateLimitExceeded')} ${formatWaitTime(90)}`);
  });

  it('counts the wait down as the clock runs', () => {
    renderHook(() => useRateLimitNotice());

    lockFor(120);
    waitSeconds(20);

    expect(lastMessage(akNotify.error)).toBe(`${akMT('rateLimitExceeded')} ${formatWaitTime(100)}`);
  });

  it('keeps one message rather than stacking a new toast per tick', () => {
    renderHook(() => useRateLimitNotice());

    lockFor(120);
    waitSeconds(40);

    const ids = vi.mocked(akNotify.error).mock.calls.map(([, options]) => options?.id);

    expect(new Set(ids).size).toBe(1);
  });

  it('holds the message on screen rather than letting it expire mid-wait', () => {
    renderHook(() => useRateLimitNotice());

    lockFor(90);

    expect(vi.mocked(akNotify.error).mock.calls.at(-1)?.[1]).toMatchObject({
      duration: Infinity,
    });
  });

  it('says the lock has lifted once the wait is over', () => {
    renderHook(() => useRateLimitNotice());

    lockFor(5);
    waitSeconds(5);

    expect(lastMessage(akNotify.info)).toBe(akMT('rateLimitLifted'));
  });

  it('announces a second lock after the first has lifted', () => {
    renderHook(() => useRateLimitNotice());

    lockFor(5);
    waitSeconds(5);
    lockFor(45);

    expect(lastMessage(akNotify.error)).toBe(`${akMT('rateLimitExceeded')} ${formatWaitTime(45)}`);
  });
});
