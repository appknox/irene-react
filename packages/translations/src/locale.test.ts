import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, isLocale, LOCALES } from '@irene/translations/locale';

describe('locale', () => {
  it('ships English and Japanese, defaulting to English', () => {
    expect(LOCALES).toEqual(['en', 'ja']);
    expect(DEFAULT_LOCALE).toBe('en');
  });

  describe('isLocale', () => {
    it.each(LOCALES)('accepts %s', (locale) => {
      expect(isLocale(locale)).toBe(true);
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
      expect(isLocale(value)).toBe(false);
    });
  });
});
