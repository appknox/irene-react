import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

import 'dayjs/locale/ja';

import { getLocale } from '@irene/translations/intl';

// `localizedFormat` is what makes the tokens below follow the language.
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(utc);

/**
 * The shapes a moment is written in, named by dayjs's localized formats.
 *
 * The values are tokens rather than patterns, so the order, separators and
 * clock follow the language: `L` is 04/03/2026 in English and 2026/04/03 in
 * Japanese.
 */
export enum DateTimeFormat {
  /** 04/03/2026 */
  L = 'L',

  /** 4/3/2026 */
  l = 'l',

  /** Apr 3, 2026 */
  ll = 'll',

  /** April 3, 2026 */
  LL = 'LL',

  /** 8:02 PM */
  LT = 'LT',

  /** 8:02:30 PM */
  LTS = 'LTS',

  /** Apr 3, 2026 8:02 PM */
  lll = 'lll',

  /** April 3, 2026 8:02 PM */
  LLL = 'LLL',

  /** Fri, Apr 3, 2026 8:02 PM */
  llll = 'llll',

  /** Friday, April 3, 2026 8:02 PM */
  LLLL = 'LLLL',
}

/** The shapes a date or time is written in, named by what they are for. */
export type DateTimeStyle =
  'date' | 'mediumDate' | 'longDate' | 'time' | 'dateTime' | 'longDateTime';

/* Named styles over the tokens above, for callers that would rather say why than how. */
const STYLE_TOKENS: Record<string, string> = {
  /** The shortest form, in digits: "04/03/2026", "2026/04/03". */
  date: DateTimeFormat.L,

  /** The month shortened, so 03/04 is never read the wrong way round: "Apr 3, 2026". */
  mediumDate: DateTimeFormat.ll,

  /** The month written out: "April 3, 2026". */
  longDate: DateTimeFormat.LL,

  /** The time of day, on the clock the language keeps: "8:02 PM", "20:02". */
  time: DateTimeFormat.LT,

  /** A date and the time of day: "04/03/2026 8:02 PM". */
  dateTime: `${DateTimeFormat.L} ${DateTimeFormat.LT}`,

  /** The month named, with the time: "April 3, 2026 8:02 PM". */
  longDateTime: DateTimeFormat.LLL,
};

/** Anything the API might send for a moment in time. */
export type DateTimeValue = string | number | Date | null | undefined;

/**
 * Writes a moment in the account's own language.
 *
 * The locale is set per call, since `dayjs.locale()` sets it globally.
 *
 * @param value - The moment, as the API sends it.
 * @param format - The shape to write it in, as a named style or a token. Defaults to the shortest date.
 * @returns The formatted text, or an empty string for a moment it cannot read.
 */
export function formatDateTime(
  value: DateTimeValue,
  format: DateTimeStyle | DateTimeFormat = DateTimeFormat.L
): string {
  if (value === null || value === undefined) {
    return '';
  }

  const date = dayjs(value);
  const token = STYLE_TOKENS[format] ?? format;

  return date.isValid() ? date.locale(getLocale()).format(token) : '';
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
