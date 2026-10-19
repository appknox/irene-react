import { afterEach, describe, expect, it } from 'vitest';

import { formatDateTime, formatRelativeTime } from '@irene/translations/date-time';
import { setLocale } from '@irene/translations/intl';

/*
  A fixed moment, built in local time so the expectations below hold wherever
  the suite runs. A UTC timestamp would read as a different hour per timezone.
*/
const APRIL_THIRD = new Date(2026, 3, 3, 20, 2);

afterEach(async () => {
  await setLocale('en');
});

describe('formatDateTime', () => {
  describe('in English', () => {
    it('writes the shortest date in digits', () => {
      expect(formatDateTime(APRIL_THIRD)).toBe('04/03/2026');
    });

    it('shortens the month, so the day and month are never read the wrong way round', () => {
      expect(formatDateTime(APRIL_THIRD, 'mediumDate')).toBe('Apr 3, 2026');
    });

    it('writes the month out in full', () => {
      expect(formatDateTime(APRIL_THIRD, 'longDate')).toBe('April 3, 2026');
    });

    it('writes the time on a twelve-hour clock', () => {
      expect(formatDateTime(APRIL_THIRD, 'time')).toBe('8:02 PM');
    });

    it('writes a date and a time together', () => {
      expect(formatDateTime(APRIL_THIRD, 'dateTime')).toBe('04/03/2026 8:02 PM');
    });

    it('names the month and writes the time', () => {
      expect(formatDateTime(APRIL_THIRD, 'longDateTime')).toBe('April 3, 2026 8:02 PM');
    });
  });

  describe('in Japanese', () => {
    it('orders the shortest date as the language does', async () => {
      await setLocale('ja');

      expect(formatDateTime(APRIL_THIRD)).toBe('2026/04/03');
    });

    it('names the month as the language does', async () => {
      await setLocale('ja');

      expect(formatDateTime(APRIL_THIRD, 'longDate')).toBe('2026年4月3日');
    });

    it('shortens the month as the language does, which does not shorten it', async () => {
      await setLocale('ja');

      expect(formatDateTime(APRIL_THIRD, 'mediumDate')).toBe('2026年4月3日');
    });

    it('writes the time on the clock the language keeps', async () => {
      await setLocale('ja');

      expect(formatDateTime(APRIL_THIRD, 'time')).toBe('20:02');
    });
  });

  describe('what it is given', () => {
    it('reads a timestamp as well as a Date', () => {
      expect(formatDateTime(APRIL_THIRD.toISOString(), 'longDate')).toBe('April 3, 2026');
    });

    it('reads milliseconds since the epoch', () => {
      expect(formatDateTime(APRIL_THIRD.getTime(), 'longDate')).toBe('April 3, 2026');
    });

    it('answers nothing for a timestamp it cannot read, rather than "Invalid Date"', () => {
      expect(formatDateTime('not a date')).toBe('');
    });

    it('answers nothing where the API sent none', () => {
      expect(formatDateTime(null)).toBe('');
      expect(formatDateTime(undefined)).toBe('');
    });
  });
});

describe('formatRelativeTime', () => {
  const threeDaysLater = new Date(2026, 3, 6, 20, 2);

  it('states the distance in words', () => {
    expect(formatRelativeTime(APRIL_THIRD, threeDaysLater)).toBe('3 days ago');
  });

  it('states it in the account\u2019s own language', async () => {
    await setLocale('ja');

    expect(formatRelativeTime(APRIL_THIRD, threeDaysLater)).toBe('3日前');
  });

  it('measures against now when nothing else is given', () => {
    expect(formatRelativeTime(new Date())).toBe('a few seconds ago');
  });

  it('answers nothing for a timestamp it cannot read', () => {
    expect(formatRelativeTime('not a date')).toBe('');
  });

  it('answers nothing where the API sent none', () => {
    expect(formatRelativeTime(null)).toBe('');
  });
});
