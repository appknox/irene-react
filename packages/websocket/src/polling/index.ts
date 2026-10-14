import type { Query } from '@tanstack/react-query';

/** What a poll runs until. */
interface PollUntilOptions<TData> {
  intervalMs: number;
  isDone: (data: TData | undefined) => boolean;
  maxAttempts?: number;
}

/** How many times a poll reads before giving up, when the caller names no limit. */
export const DEFAULT_POLL_ATTEMPTS = 60;

/**
 * Polls a query until it reports itself finished, or the attempts run out.
 *
 * Some things the server changes carry no event — a report rendering, a scan
 * progressing — so they are read on a schedule. It stops twice over: when the
 * data says it is done, and after a fixed number of reads, so a status that
 * never settles does not poll for the life of the tab. It pauses while the tab
 * is in the background.
 *
 * @param options.intervalMs - How long to wait between reads.
 * @param options.isDone - Whether the data says there is nothing left to wait for.
 * @param options.maxAttempts - How many reads before giving up.
 * @returns The query options that drive the schedule.
 */
export function pollUntil<TData>({
  intervalMs,
  isDone,
  maxAttempts = DEFAULT_POLL_ATTEMPTS,
}: PollUntilOptions<TData>) {
  return {
    refetchInterval: (query: Query<TData>) => {
      if (isDone(query.state.data)) {
        return false;
      }

      /* The first read is the query's own, so the attempts counted here are the polls. */
      return query.state.dataUpdateCount > maxAttempts ? false : intervalMs;
    },
  };
}
