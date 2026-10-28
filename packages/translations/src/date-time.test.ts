import { afterEach, describe, expect, it } from 'vitest';

import {
  DateTimeFormat,
  formatDateTime,
  formatRelativeTime,
  getUTCDateString,
} from '@irene/translations/date-time';

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
      expect(formatDateTime(APRIL_THIRD, DateTimeFormat.ll)).toBe('Apr 3, 2026');
    });

    it('writes the month out in full', () => {
      expect(formatDateTime(APRIL_THIRD, DateTimeFormat.LL)).toBe('April 3, 2026');
    });

    it('writes the time on a twelve-hour clock', () => {
      expect(formatDateTime(APRIL_THIRD, DateTimeFormat.LT)).toBe('8:02 PM');
    });

    it('writes a date and a time together', () => {
      expect(formatDateTime(APRIL_THIRD, DateTimeFormat.lll)).toBe('Apr 3, 2026 8:02 PM');
    });

    it('names the month and writes the time', () => {
      expect(formatDateTime(APRIL_THIRD, DateTimeFormat.LLL)).toBe('April 3, 2026 8:02 PM');
    });
  });

  describe('in Japanese', () => {
    it('orders the shortest date as the language does', async () => {
      await setLocale('ja');

      expect(formatDateTime(APRIL_THIRD)).toBe('04/03/2026');
    });

    it('names the month as the language does', async () => {
      await setLocale('ja');

      expect(formatDateTime(APRIL_THIRD, DateTimeFormat.LL)).toBe('4月 3, 2026');
    });

    it('shortens the month as the language does, which does not shorten it', async () => {
      await setLocale('ja');

      expect(formatDateTime(APRIL_THIRD, DateTimeFormat.ll)).toBe('4月 3, 2026');
    });

    it('writes the time on the clock the language keeps', async () => {
      await setLocale('ja');

      expect(formatDateTime(APRIL_THIRD, DateTimeFormat.LT)).toBe('8:02 午後');
    });
  });

  describe('what it is given', () => {
    it('reads a timestamp as well as a Date', () => {
      expect(formatDateTime(APRIL_THIRD.toISOString(), DateTimeFormat.LL)).toBe('April 3, 2026');
    });

    it('reads milliseconds since the epoch', () => {
      expect(formatDateTime(APRIL_THIRD.getTime(), DateTimeFormat.LL)).toBe('April 3, 2026');
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

describe('getUTCDateString', () => {
  it('keys a moment by its UTC day, which is the zone the API truncated it in', () => {
    expect(getUTCDateString('2026-03-04T00:00:00Z')).toBe('2026-03-04');
  });

  it('keeps the first hour of a UTC day on that day', () => {
    expect(getUTCDateString('2026-03-04T00:30:00Z')).toBe('2026-03-04');
  });

  it('keeps the last hour of a UTC day on that day', () => {
    expect(getUTCDateString('2026-03-04T23:59:00Z')).toBe('2026-03-04');
  });

  it('answers nothing for a moment it cannot read', () => {
    expect(getUTCDateString('not a date')).toBe('');
    expect(getUTCDateString(null)).toBe('');
  });
});
