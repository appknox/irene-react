import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

import 'dayjs/locale/ja';

import { getLocale } from '@irene/translations/intl';

dayjs.extend(relativeTime);
dayjs.extend(utc);

/** The shapes a moment is written in, named by dayjs's localized formats. */
export enum DateTimeFormat {
  /** 04/03/2026 */
  L = 'MM/DD/YYYY',

  /** 4/3/2026 */
  l = 'M/D/YYYY',

  /** Apr 3, 2026 */
  ll = 'MMM D, YYYY',

  /** April 3, 2026 */
  LL = 'MMMM D, YYYY',

  /** 8:02 PM */
  LT = 'h:mm A',

  /** 8:02:30 PM */
  LTS = 'h:mm:ss A',

  /** Apr 3, 2026 8:02 PM */
  lll = 'MMM D, YYYY h:mm A',

  /** April 3, 2026 8:02 PM */
  LLL = 'MMMM D, YYYY h:mm A',

  /** Fri, Apr 3, 2026 8:02 PM */
  llll = 'ddd, MMM D, YYYY h:mm A',

  /** Friday, April 3, 2026 8:02 PM */
  LLLL = 'dddd, MMMM D, YYYY h:mm A',
}

/** Anything the API might send for a moment in time. */
export type DateTimeValue = string | number | Date | null | undefined;

/**
 * Writes a moment in the account's own language.
 *
 * The locale is set per call, since `dayjs.locale()` sets it globally.
 *
 * @param value - The moment, as the API sends it.
 * @param format - The shape to write it in. Defaults to the shortest date.
 * @returns The formatted text, or an empty string for a moment it cannot read.
 */
export function formatDateTime(value: DateTimeValue, format: DateTimeFormat = DateTimeFormat.L) {
  if (value === null || value === undefined) {
    return '';
  }

  const date = dayjs(value);

  return date.isValid() ? date.locale(getLocale()).format(format) : '';
}

/**
 * States how long ago something happened, in the account's own language.
 *
 * @param value - When it happened, as the API sends it.
 * @param now - The moment to measure against. Defaults to the current time.
 * @returns The distance in words, e.g. "3 days ago", or an empty string for a moment it cannot read.
 */
export function formatRelativeTime(value: DateTimeValue, now: Date = new Date()): string {
  if (value === null || value === undefined) {
    return '';
  }

  const date = dayjs(value);

  return date.isValid() ? date.locale(getLocale()).from(dayjs(now)) : '';
}

/**
 * The date a moment falls on in UTC.
 *
 * For grouping rather than reading, so it is not localized. The API truncates
 * to UTC midnight, and the viewer's own zone would shift the date.
 *
 * @param value - The moment, as the API sends it.
 * @returns The date as `YYYY-MM-DD`, or an empty string for a moment it cannot read.
 */
export function getUTCDateString(value: DateTimeValue): string {
  if (value === null || value === undefined) {
    return '';
  }

  const date = dayjs.utc(value);

  return date.isValid() ? date.format('YYYY-MM-DD') : '';
}
