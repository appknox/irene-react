import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  akDateRangeShortcuts,
  endOfToday,
  yearToDateRange,
} from '@irene/ui/ak-date-range-picker/helpers';

/** A fixed afternoon, so every span below is measured from the same day. */
const NOW = new Date(2026, 9, 19, 14, 30);

const LABELS = {
  yearToDate: 'Year to date',
  last3Months: 'Last 3 months',
  last6Months: 'Last 6 months',
  lastYear: 'Last year',
};

describe('endOfToday', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ends on the last moment of today, so today is inside every range', () => {
    expect(endOfToday()).toEqual(new Date(2026, 9, 19, 23, 59, 59, 999));
  });
});

describe('yearToDateRange', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs from the first of January to the end of today', () => {
    expect(yearToDateRange()).toEqual([
      new Date(2026, 0, 1),
      new Date(2026, 9, 19, 23, 59, 59, 999),
    ]);
  });
});

describe('akDateRangeShortcuts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('offers the four spans, named by the caller', () => {
    expect(akDateRangeShortcuts(LABELS).map(({ id, label }) => ({ id, label }))).toEqual([
      { id: 'yearToDate', label: 'Year to date' },
      { id: 'last3Months', label: 'Last 3 months' },
      { id: 'last6Months', label: 'Last 6 months' },
      { id: 'lastYear', label: 'Last year' },
    ]);
  });

  it('counts each span back from today, to the start of that day', () => {
    const [, last3Months, last6Months, lastYear] = akDateRangeShortcuts(LABELS);

    expect(last3Months!.range()[0]).toEqual(new Date(2026, 6, 19));
    expect(last6Months!.range()[0]).toEqual(new Date(2026, 3, 19));
    expect(lastYear!.range()[0]).toEqual(new Date(2025, 9, 19));
  });

  it('ends every span at the end of today', () => {
    const endOfDay = new Date(2026, 9, 19, 23, 59, 59, 999);

    akDateRangeShortcuts(LABELS).forEach((shortcut) => {
      expect(shortcut.range()[1]).toEqual(endOfDay);
    });
  });
});
