import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import 'dayjs/locale/ja';

import { getLocale } from '@irene/translations/intl';

dayjs.extend(relativeTime);

/**
 * States how long ago something happened, in the account's own language.
 *
 * The locale is applied per call rather than through `dayjs.locale()`, which
 * sets it globally: a second caller switching languages would otherwise change
 * what this returns.
 *
 * @param timestamp - When it happened, as the API returns it.
 * @param now - The moment to measure against. Defaults to the current time.
 * @returns The distance in words, e.g. "3 days ago", or an empty string for an unreadable timestamp.
 */
export function formatRelativeTime(timestamp: string, now: Date = new Date()): string {
  const then = dayjs(timestamp);

  if (then.isValid()) {
    return then.locale(getLocale()).from(dayjs(now));
  }

  return '';
}
