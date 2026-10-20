/** The two ends of a range, either of which may be unset while one is being picked. */
export type AkDateRange = [Date | null, Date | null];

/** The ranges the picker offers unless a caller names its own. */
export type AkDateRangeShortcutId = 'yearToDate' | 'last3Months' | 'last6Months' | 'lastYear';

/** One of the ranges the picker offers in a click. */
export interface AkDateRangeShortcut {
  id: AkDateRangeShortcutId;
  label: string;
  range: () => AkDateRange;
}

/** The end of today, where every range the picker offers ends. */
export const endOfToday = () => {
  const today = new Date();

  return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
};

/** The start of the day a given number of months back. */
const monthsBack = (months: number) => {
  const today = new Date();

  return new Date(today.getFullYear(), today.getMonth() - months, today.getDate());
};

/** The span this year has covered so far, which is how a year is usually read. */
export const yearToDateRange = (): AkDateRange => [
  new Date(new Date().getFullYear(), 0, 1),
  endOfToday(),
];

/**
 * The spans the picker offers in a click, built on each call so each one ends today.
 *
 * The ranges are the picker's; the labels are the caller's, since this package
 * does not translate.
 *
 * @param labels - What to call each range.
 * @returns The shortcuts, longest span last.
 */
export const akDateRangeShortcuts = (
  labels: Readonly<Record<AkDateRangeShortcutId, string>>
): AkDateRangeShortcut[] => [
  { id: 'yearToDate', label: labels.yearToDate, range: yearToDateRange },
  { id: 'last3Months', label: labels.last3Months, range: () => [monthsBack(3), endOfToday()] },
  { id: 'last6Months', label: labels.last6Months, range: () => [monthsBack(6), endOfToday()] },
  { id: 'lastYear', label: labels.lastYear, range: () => [monthsBack(12), endOfToday()] },
];
