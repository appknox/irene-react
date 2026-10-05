import { describe, expect, it } from 'vitest';
import type { Query } from '@tanstack/react-query';

import { DEFAULT_POLL_ATTEMPTS, pollUntil } from './index';

/** A query the schedule is asked about, with whatever it has read so far. */
const queryWith = (data: { status: string } | undefined, dataUpdateCount = 1) =>
  ({ state: { data, dataUpdateCount } }) as Query<{ status: string }>;

const everyThreeSeconds = pollUntil<{ status: string }>({
  intervalMs: 3000,
  isDone: (data) => data?.status === 'done',
});

describe('pollUntil', () => {
  it('keeps reading while the data says there is more to wait for', () => {
    expect(everyThreeSeconds.refetchInterval(queryWith({ status: 'running' }))).toBe(3000);
  });

  it('stops once the data says it is done', () => {
    expect(everyThreeSeconds.refetchInterval(queryWith({ status: 'done' }))).toBe(false);
  });

  it('keeps reading before the query has read anything', () => {
    expect(everyThreeSeconds.refetchInterval(queryWith(undefined))).toBe(3000);
  });

  it('stops once the reads run out, so a status that never settles does not poll forever', () => {
    const query = queryWith({ status: 'running' }, DEFAULT_POLL_ATTEMPTS + 1);

    expect(everyThreeSeconds.refetchInterval(query)).toBe(false);
  });

  it('keeps reading on the last attempt it is allowed', () => {
    const query = queryWith({ status: 'running' }, DEFAULT_POLL_ATTEMPTS);

    expect(everyThreeSeconds.refetchInterval(query)).toBe(3000);
  });

  it('stops at the limit the caller named instead', () => {
    const twice = pollUntil<{ status: string }>({
      intervalMs: 1000,
      isDone: () => false,
      maxAttempts: 2,
    });

    expect(twice.refetchInterval(queryWith({ status: 'running' }, 2))).toBe(1000);
    expect(twice.refetchInterval(queryWith({ status: 'running' }, 3))).toBe(false);
  });

  it('stops on done even with attempts left', () => {
    expect(everyThreeSeconds.refetchInterval(queryWith({ status: 'done' }, 1))).toBe(false);
  });
});
