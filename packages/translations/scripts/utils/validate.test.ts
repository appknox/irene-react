import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { flattenMessages, type MessageTree } from './flatten.ts';
import { validateTranslations } from './validate.ts';

const translationsDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../translations');

const readLocale = (locale: string) =>
  flattenMessages(
    JSON.parse(readFileSync(resolve(translationsDir, `${locale}.json`), 'utf8')) as MessageTree
  );

describe('validateTranslations', () => {
  describe('with the shipped translation files', () => {
    it('finds no problems, so the build can pass', () => {
      expect(validateTranslations({ en: readLocale('en'), ja: readLocale('ja') }, 'en')).toEqual(
        []
      );
    });
  });

  describe('when the locales hold the same messages', () => {
    it('accepts plain, argument, plural, select and tag messages', () => {
      const en = {
        plain: 'Login',
        argument: 'Hello {name}',
        plural: '{count, plural, one {# file} other {# files}}',
        select: '{kind, select, app {App} other {Other}}',
        tag: 'Click <strong>{label}</strong>',
      };

      const ja = {
        plain: 'ログイン',
        argument: 'こんにちは {name}',
        plural: '{count, plural, other {# ファイル}}',
        select: '{kind, select, app {アプリ} other {その他}}',
        tag: '<strong>{label}</strong> をクリック',
      };

      expect(validateTranslations({ en, ja }, 'en')).toEqual([]);
    });
  });

  describe('when ids differ', () => {
    it('reports a message missing from a locale', () => {
      expect(validateTranslations({ en: { a: 'A', b: 'B' }, ja: { a: 'エー' } }, 'en')).toEqual([
        'ja: "b" is missing',
      ]);
    });

    it('reports a message only a translation has', () => {
      expect(validateTranslations({ en: { a: 'A' }, ja: { a: 'エー', extra: 'x' } }, 'en')).toEqual(
        ['ja: "extra" is not in en']
      );
    });
  });

  describe('when a message does not parse', () => {
    it('reports an unclosed tag', () => {
      const [problem] = validateTranslations({ en: { a: 'keep the <n> newest' } }, 'en');

      expect(problem).toMatch(/^en: "a" does not parse \(UNCLOSED_TAG\)$/);
    });

    it('reports a tag with attributes', () => {
      const [problem] = validateTranslations({ en: { a: "<b class='bold'>x</b>" } }, 'en');

      expect(problem).toMatch(/^en: "a" does not parse/);
    });

    it('reports an unbalanced brace in a translation', () => {
      const [problem] = validateTranslations(
        { en: { a: 'Hi {name}' }, ja: { a: 'やあ {name' } },
        'en'
      );

      expect(problem).toMatch(/^ja: "a" does not parse/);
    });

    it('accepts angle brackets escaped with apostrophes', () => {
      expect(validateTranslations({ en: { a: "keep the '<n>' newest" } }, 'en')).toEqual([]);
    });
  });

  describe('when arguments differ', () => {
    it('reports a renamed argument', () => {
      expect(
        validateTranslations({ en: { a: 'Hi {name}' }, ja: { a: 'やあ {user}' } }, 'en')
      ).toEqual(['ja: "a" uses arguments [user], en uses [name]']);
    });

    it('reports a dropped argument', () => {
      expect(
        validateTranslations({ en: { a: '{shown} of {total}' }, ja: { a: '{total} 件' } }, 'en')
      ).toEqual(['ja: "a" uses arguments [total], en uses [shown, total]']);
    });

    it('reads arguments inside plural options and tags', () => {
      const en = { a: '{count, plural, other {<b>{name}</b>}}' };
      const ja = { a: '{count, plural, other {<b>{title}</b>}}' };

      expect(validateTranslations({ en, ja }, 'en')).toEqual([
        'ja: "a" uses arguments [count, title], en uses [count, name]',
      ]);
    });

    it('ignores argument order', () => {
      expect(
        validateTranslations({ en: { a: '{a} then {b}' }, ja: { a: '{b} の前に {a}' } }, 'en')
      ).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('reports every problem, not just the first', () => {
      expect(
        validateTranslations({ en: { a: 'A', b: 'Hi {x}' }, ja: { b: 'やあ {y}', c: 'C' } }, 'en')
      ).toHaveLength(3);
    });

    it('treats a missing reference locale as empty', () => {
      expect(validateTranslations({ ja: { a: 'エー' } }, 'en')).toEqual(['ja: "a" is not in en']);
    });
  });
});
