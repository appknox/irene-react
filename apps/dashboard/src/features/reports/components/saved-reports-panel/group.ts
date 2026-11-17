import type { ApiSavedReportSummary } from '@irene/api/services/saved-report';

/** The sections of the Saved reports panel, in the order they are shown. */
export const SAVED_REPORT_GROUPS = [
  'pinned',
  'today',
  'yesterday',
  'previous7Days',
  'previous30Days',
  'older',
] as const;

/** One section of the Saved reports panel. */
export type SavedReportGroup = (typeof SAVED_REPORT_GROUPS)[number];

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Which section a report sits in: pinned reports together on top, the rest by
 * when they last changed, counted in whole local days as the design does.
 *
 * @param report - The report.
 * @param now - The time to count from.
 * @returns The report's section.
 */
export function getSavedReportGroup(report: ApiSavedReportSummary, now: Date): SavedReportGroup {
  if (report.pinned) {
    return 'pinned';
  }

  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  const changed = new Date(report.updated_on).getTime();

  if (changed >= startOfToday) {
    return 'today';
  }

  if (changed >= startOfToday - DAY_MS) {
    return 'yesterday';
  }

  if (changed >= startOfToday - 7 * DAY_MS) {
    return 'previous7Days';
  }

  return changed >= startOfToday - 30 * DAY_MS ? 'previous30Days' : 'older';
}

/**
 * The panel's sections with their reports, leaving out the empty ones.
 *
 * Reports keep the order Luna sends them in (pinned first, latest change first),
 * so each section is already sorted.
 *
 * @param reports - The account's saved reports.
 * @param now - The time to count from.
 * @returns The non-empty sections, in display order.
 */
export function groupSavedReports(reports: ApiSavedReportSummary[], now: Date) {
  const byGroup = new Map<SavedReportGroup, ApiSavedReportSummary[]>();

  for (const report of reports) {
    const group = getSavedReportGroup(report, now);
    byGroup.set(group, [...(byGroup.get(group) ?? []), report]);
  }

  return SAVED_REPORT_GROUPS.flatMap((group) => {
    const items = byGroup.get(group);

    return items ? [{ group, reports: items }] : [];
  });
}
