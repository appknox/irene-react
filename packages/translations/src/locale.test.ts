import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_LOCALE,
  getStoredLocale,
  isSupportedLocale,
  LOCALES,
  storeLocale,
} from '@irene/translations/locale';

describe('locale', () => {
  it('supports en and ja, defaulting to en', () => {
    expect(LOCALES).toEqual(['en', 'ja']);
    expect(DEFAULT_LOCALE).toBe('en');
  });

  describe('isSupportedLocale', () => {
    it.each(LOCALES)('accepts %s', (locale) => {
      expect(isSupportedLocale(locale)).toBe(true);
    });

    it.each([
      ['an unsupported locale', 'fr'],
      ['a region-tagged locale', 'en-US'],
      ['different casing', 'EN'],
      ['an empty string', ''],
      ['a number', 1],
      ['null', null],
      ['undefined', undefined],
    ])('rejects %s', (_, value) => {
      expect(isSupportedLocale(value)).toBe(false);
    });
  });
});

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('the stored locale', () => {
  it('returns null before a locale is stored', () => {
    expect(getStoredLocale()).toBeNull();
  });

  it('returns the locale that was stored', () => {
    storeLocale('ja');

    expect(getStoredLocale()).toBe('ja');
  });

  it('returns null for an unsupported value', () => {
    window.localStorage.setItem('irene:locale', 'kl');

    expect(getStoredLocale()).toBeNull();
  });

  it('returns null when reading storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Access denied');
    });

    expect(getStoredLocale()).toBeNull();
  });

  it('does not throw when writing to storage throws an error', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Access denied');
    });

    expect(() => storeLocale('ja')).not.toThrow();
  });
});
