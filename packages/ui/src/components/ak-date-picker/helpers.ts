import dayjs from 'dayjs';

/** A span of days, either end of which may be unset while one is being chosen. */
export interface AkDateRange {
  start: Date | null;
  end: Date | null;
}

/** One of the spans the picker offers outright, rather than by pointing at days. */
export interface AkDateQuickSelect {
  key: string;
  label: string;
  range: () => AkDateRange;
}

/** A span ending today and starting the given number of days before it. */
const lastDays = (days: number): AkDateRange => ({
  start: dayjs()
    .startOf('day')
    .subtract(days - 1, 'days')
    .toDate(),
  end: dayjs().startOf('day').toDate(),
});

/** A span ending today and starting the given number of months before it. */
const lastMonths = (months: number): AkDateRange => ({
  start: dayjs().startOf('day').subtract(months, 'months').add(1, 'day').toDate(),
  end: dayjs().startOf('day').toDate(),
});

/**
 * The spans irene offers on a range picker, by the keys it names them with.
 *
 * Each is read when it is chosen rather than when the module loads, so a span
 * is relative to the day it is chosen on.
 */
export const AK_DATE_QUICK_SELECTS: Record<string, Omit<AkDateQuickSelect, 'key'>> = {
  last7Days: { label: 'Last 7 days', range: () => lastDays(7) },
  last30Days: { label: 'Last 30 days', range: () => lastDays(30) },
  last3Months: { label: 'Last 3 months', range: () => lastMonths(3) },
  last6Months: { label: 'Last 6 months', range: () => lastMonths(6) },

  lastYear: {
    label: 'Last year',

    range: () => ({
      start: dayjs().startOf('day').subtract(1, 'year').add(1, 'day').toDate(),
      end: dayjs().startOf('day').toDate(),
    }),
  },
};

/**
 * Resolves the keys a caller named into the spans they stand for.
 *
 * @param keys - The spans to offer, in the order they are to be read.
 * @returns Each span that is known, left in that order.
 */
export function resolveQuickSelects(keys: string[]): AkDateQuickSelect[] {
  return keys
    .filter((key) => Object.hasOwn(AK_DATE_QUICK_SELECTS, key))
    .map((key) => ({ key, ...AK_DATE_QUICK_SELECTS[key] }) as AkDateQuickSelect);
}

/**
 * The days of one month's grid, including the days either side that fill the
 * first and last weeks.
 *
 * @param month - Any day in the month to draw.
 * @returns Six weeks of days, starting on Sunday as irene's calendar does.
 */
export function monthGrid(month: Date): Date[] {
  const firstCell = dayjs(month).startOf('month').startOf('week');

  return Array.from({ length: 42 }, (_unused, cell) => firstCell.add(cell, 'day').toDate());
}
