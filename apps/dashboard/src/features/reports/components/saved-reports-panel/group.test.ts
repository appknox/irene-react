import { describe, expect, it } from 'vitest';

import { buildSavedReportSummary } from '@tests/factories';

import { getSavedReportGroup, groupSavedReports } from './group';

const NOW = new Date(2026, 10, 16, 15, 0);

/** A report last changed this many days before NOW, at the given hour. */
const changedDaysAgo = (days: number, hour = 12) =>
  buildSavedReportSummary({
    pinned: false,
    updated_on: new Date(2026, 10, 16 - days, hour).toISOString(),
  });

describe('getSavedReportGroup', () => {
  it('puts pinned reports together whenever they changed', () => {
    const report = { ...changedDaysAgo(90), pinned: true };

    expect(getSavedReportGroup(report, NOW)).toBe('pinned');
  });

  it('counts whole local days', () => {
    expect(getSavedReportGroup(changedDaysAgo(0, 0), NOW)).toBe('today');
    expect(getSavedReportGroup(changedDaysAgo(1, 23), NOW)).toBe('yesterday');
    expect(getSavedReportGroup(changedDaysAgo(1, 0), NOW)).toBe('yesterday');
    expect(getSavedReportGroup(changedDaysAgo(2), NOW)).toBe('previous7Days');
    expect(getSavedReportGroup(changedDaysAgo(7, 0), NOW)).toBe('previous7Days');
    expect(getSavedReportGroup(changedDaysAgo(8), NOW)).toBe('previous30Days');
    expect(getSavedReportGroup(changedDaysAgo(31), NOW)).toBe('older');
  });
});

describe('groupSavedReports', () => {
  it('returns only the sections that have reports, in display order, keeping each report’s order', () => {
    const old = changedDaysAgo(40);
    const first = changedDaysAgo(0, 14);
    const second = changedDaysAgo(0, 9);
    const pinned = { ...changedDaysAgo(3), pinned: true };

    expect(groupSavedReports([pinned, first, second, old], NOW)).toEqual([
      { group: 'pinned', reports: [pinned] },
      { group: 'today', reports: [first, second] },
      { group: 'older', reports: [old] },
    ]);
  });
});
