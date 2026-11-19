import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';

import 'dayjs/locale/ja';

import { getLocale } from '@irene/translations/intl';

// `localizedFormat` is what makes the tokens below follow the language.
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

/** The shapes a date or time is written in. */
export type DateTimeStyle =
  | 'date'
  | 'mediumDate'
  | 'longDate'
  | 'time'
  | 'dateTime'
  | 'longDateTime';

/* Tokens rather than patterns, so the order, separators and clock follow the language. */
const STYLE_TOKENS: Record<DateTimeStyle, string> = {
  /** The shortest form, in digits: "04/03/2026", "2026/04/03". */
  date: 'L',

  /** The month shortened, so 03/04 is never read the wrong way round: "Apr 3, 2026". */
  mediumDate: 'll',

  /** The month written out: "April 3, 2026". */
  longDate: 'LL',

  /** The time of day, on the clock the language keeps: "8:02 PM", "20:02". */
  time: 'LT',

  /** A date and the time of day: "04/03/2026 8:02 PM". */
  dateTime: 'L LT',

  /** The month named, with the time: "April 3, 2026 8:02 PM". */
  longDateTime: 'LLL',
};

/** Anything the API might send for a moment in time. */
export type DateTimeValue = string | number | Date | null | undefined;

/**
 * Writes a moment in the account's own language.
 *
 * The locale is applied per call, since `dayjs.locale()` would set it globally.
 *
 * @param value - The moment, as the API sends it.
 * @param style - The shape to write it in. Defaults to the shortest date.
 * @returns The formatted text, or an empty string for a moment it cannot read.
 */
export function formatDateTime(value: DateTimeValue, style: DateTimeStyle = 'date'): string {
  if (value === null || value === undefined) {
    return '';
  }

  const moment = dayjs(value);

  return moment.isValid() ? moment.locale(getLocale()).format(STYLE_TOKENS[style]) : '';
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

  const moment = dayjs(value);

  return moment.isValid() ? moment.locale(getLocale()).from(dayjs(now)) : '';
}
