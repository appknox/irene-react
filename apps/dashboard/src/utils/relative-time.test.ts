import { beforeAll, describe, expect, it } from 'vitest';

import { setLocale } from '@irene/translations/intl';
import { formatRelativeTime } from '@/utils/relative-time';

const NOW = new Date('2026-09-29T12:00:00Z');

const agoBy = (milliseconds: number) =>
  formatRelativeTime(new Date(NOW.getTime() - milliseconds).toISOString(), NOW);

describe('formatRelativeTime', () => {
  /* The distance is worded in the account's language, so the language is pinned. */
  beforeAll(async () => {
    await setLocale('en');
  });

  it('rounds anything under a minute to a few seconds', () => {
    expect(agoBy(30 * 1000)).toBe('a few seconds ago');
  });

  it('counts in minutes under an hour', () => {
    expect(agoBy(5 * 60 * 1000)).toBe('5 minutes ago');
  });

  it('counts in hours under a day', () => {
    expect(agoBy(3 * 60 * 60 * 1000)).toBe('3 hours ago');
  });

  it('counts in days under a month', () => {
    expect(agoBy(3 * 24 * 60 * 60 * 1000)).toBe('3 days ago');
  });

  it('counts in months beyond a month', () => {
    expect(agoBy(60 * 24 * 60 * 60 * 1000)).toBe('2 months ago');
  });

  it('counts in years beyond a year', () => {
    expect(agoBy(400 * 24 * 60 * 60 * 1000)).toBe('a year ago');
  });

  it('counts forward for a timestamp in the future', () => {
    expect(agoBy(-2 * 60 * 60 * 1000)).toBe('in 2 hours');
  });

  it('returns an empty string for a timestamp it cannot read', () => {
    expect(formatRelativeTime('not-a-date', NOW)).toBe('');
  });
});
