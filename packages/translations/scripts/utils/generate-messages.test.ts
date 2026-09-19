import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { formatProblems, generateMessages, type GenerateOptions } from './generate-messages.ts';

let root: string;
let options: GenerateOptions;

const writeLocale = (locale: string, content: unknown) =>
  writeFileSync(
    join(options.translationsDir, `${locale}.json`),
    typeof content === 'string' ? content : JSON.stringify(content)
  );

const readGenerated = (locale: string) =>
  JSON.parse(readFileSync(join(options.generatedDir, `${locale}.json`), 'utf8'));

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'translations-'));
  options = { translationsDir: root, generatedDir: join(root, 'generated') };
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('generateMessages', () => {
  describe('when the translations are valid', () => {
    it('writes flat files for every locale', () => {
      writeLocale('en', { login: 'Login', nested: { title: 'Title' } });
      writeLocale('ja', { login: 'ログイン', nested: { title: 'タイトル' } });

      expect(generateMessages(options)).toEqual([]);
      expect(readGenerated('en')).toEqual({ login: 'Login', 'nested.title': 'Title' });
      expect(readGenerated('ja')).toEqual({ login: 'ログイン', 'nested.title': 'タイトル' });
    });

    it('lists the ids whose messages contain markup', () => {
      writeLocale('en', { plain: 'Login', rich: 'a<br>b' });
      writeLocale('ja', { plain: 'ログイン', rich: 'あ<br>い' });

      generateMessages(options);

      expect(readFileSync(join(options.generatedDir, 'rich-message-ids.ts'), 'utf8')).toContain(
        'export const RICH_MESSAGE_IDS = [\n  "rich",\n] as const;'
      );
    });

    it('writes an empty list when no message has markup', () => {
      writeLocale('en', { plain: 'Login' });
      writeLocale('ja', { plain: 'ログイン' });

      generateMessages(options);

      expect(readFileSync(join(options.generatedDir, 'rich-message-ids.ts'), 'utf8')).toContain(
        'export const RICH_MESSAGE_IDS = [\n] as const;'
      );
    });

    it('writes the argument types each message needs', () => {
      writeLocale('en', { plain: 'Login', count: '{n, plural, other {# files}} for {name}' });
      writeLocale('ja', { plain: 'ログイン', count: '{name} の {n, plural, other {# ファイル}}' });

      generateMessages(options);

      const source = readFileSync(join(options.generatedDir, 'message-arguments.ts'), 'utf8');

      expect(source).toContain('"count": { "n": number; "name": PrimitiveType; };');
      expect(source).not.toContain('"plain"');
    });

    it('leaves an unchanged file untouched', () => {
      writeLocale('en', { login: 'Login' });
      writeLocale('ja', { login: 'ログイン' });
      generateMessages(options);

      const firstWrite = statSync(join(options.generatedDir, 'en.json')).mtimeMs;

      generateMessages(options);

      expect(statSync(join(options.generatedDir, 'en.json')).mtimeMs).toBe(firstWrite);
    });
  });

  describe('when the translations are invalid', () => {
    it('reports the problems and writes nothing', () => {
      writeLocale('en', { login: 'Login', next: 'Next' });
      writeLocale('ja', { login: 'ログイン' });

      expect(generateMessages(options)).toEqual(['ja: "next" is missing']);
      expect(existsSync(options.generatedDir)).toBe(false);
    });

    it('keeps the last good files when a later edit breaks them', () => {
      writeLocale('en', { login: 'Login' });
      writeLocale('ja', { login: 'ログイン' });
      generateMessages(options);

      writeLocale('ja', { login: 'ログイン {oops' });

      expect(generateMessages(options)).toHaveLength(1);
      expect(readGenerated('ja')).toEqual({ login: 'ログイン' });
    });

    it('reports a file that is not valid JSON, as happens mid-edit', () => {
      writeLocale('en', '{ "login": "Login", ');
      writeLocale('ja', { login: 'ログイン' });

      const [problem] = generateMessages(options);

      expect(problem).toMatch(/^en\.json is not valid JSON/);
    });

    it('reports an unsupported tag and writes nothing', () => {
      writeLocale('en', { link: 'Read <a>the docs</a>' });
      writeLocale('ja', { link: '<a>ドキュメント</a>を読む' });

      const problems = generateMessages(options);

      expect(problems).toHaveLength(2);
      expect(problems[0]).toContain('en: "link" uses <a>, which has no renderer.');
      expect(existsSync(options.generatedDir)).toBe(false);
    });

    it('reports a missing locale file', () => {
      writeLocale('en', { login: 'Login' });

      expect(generateMessages(options)).toEqual(['ja.json does not exist']);
    });
  });
});

describe('formatProblems', () => {
  it('lists each problem under a heading and says where to fix them', () => {
    expect(formatProblems(['ja: "a" is missing', 'ja: "b" is missing'])).toBe(
      [
        'Translations are invalid:',
        '  - ja: "a" is missing',
        '  - ja: "b" is missing',
        '',
        'Fix packages/translations/translations/en.json and ja.json. The app updates once the files are valid.',
      ].join('\n')
    );
  });
});
