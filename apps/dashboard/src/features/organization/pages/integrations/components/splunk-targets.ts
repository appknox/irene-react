/** How often user logs are sent, in hours, as irene offers them. */
export const LOG_FREQUENCIES = [24, 48, 72];

/** What a Splunk connection writes where, which step two chooses and the panel edits. */
export interface SplunkTargets {
  vulnerabilityIndex: string;
  sendUserLogs: boolean;
  userLogsIndex: string;
  logFrequencyHours: number;
}

/** What a connection that does not exist yet writes where. */
export const EMPTY_TARGETS: SplunkTargets = {
  vulnerabilityIndex: '',
  sendUserLogs: false,
  userLogsIndex: '',
  logFrequencyHours: LOG_FREQUENCIES[0] ?? 24,
};

/**
 * Settles which index a choice lands on.
 *
 * irene points the two indexes at the first and second index the instance
 * answered with, so a new connection never opens on an empty choice. An index
 * the instance no longer holds is replaced the same way.
 *
 * @param current - The index chosen so far, which may be none.
 * @param indexes - The indexes the instance holds, which are unknown until it answers.
 * @param position - Which of them to fall back to: the first for findings, the second for logs.
 * @returns The index to show.
 */
export function chooseIndex(current: string, indexes: string[], position: number) {
  if (indexes.length === 0 || indexes.includes(current)) {
    return current;
  }

  return indexes[position] ?? indexes[0] ?? current;
}
