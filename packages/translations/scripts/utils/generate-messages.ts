import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { flattenMessages, type FlatMessages } from './flatten.ts';
import { findMessageArguments, type ArgumentKind } from './message-arguments.ts';
import { findRichMessageIds, findUnsupportedTags } from './rich-messages.ts';
import { validateTranslations } from './validate.ts';

/** Where the authored translation files live and where their flat copies go. */
export interface GenerateOptions {
  translationsDir: string;
  generatedDir: string;
}

const LOCALES = ['en', 'ja'];
const REFERENCE_LOCALE = 'en';

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export const DEFAULT_GENERATE_OPTIONS: GenerateOptions = {
  translationsDir: join(packageDir, 'translations'),
  generatedDir: join(packageDir, 'src', 'generated'),
};

/**
 * Reads and flattens one locale's file.
 *
 * @param translationsDir - The folder holding the translation files.
 * @param locale - The locale to read.
 * @returns The flat messages, or the problem that stopped the file being read.
 */
type ReadLocaleResult = { messages: FlatMessages } | { problem: string };

function _readLocale(translationsDir: string, locale: string): ReadLocaleResult {
  const path = join(translationsDir, `${locale}.json`);

  if (!existsSync(path)) {
    return { problem: `${locale}.json does not exist` };
  }

  try {
    return { messages: flattenMessages(JSON.parse(readFileSync(path, 'utf8'))) };
  } catch (error) {
    return {
      problem: `${locale}.json is not valid JSON (${error instanceof Error ? error.message : 'unreadable'})`,
    };
  }
}

/**
 * Writes a file only when its content changed, so an unrelated save does not trigger a reload.
 *
 * @param path - The file to write.
 * @param content - The content it should hold.
 */
function _writeIfChanged(path: string, content: string) {
  if (existsSync(path) && readFileSync(path, 'utf8') === content) {
    return;
  }

  writeFileSync(path, content);
}

/**
 * Renders the typed list of ids whose messages contain markup.
 *
 * @param ids - The ids.
 * @returns The source of the generated module.
 */
const _renderRichMessageIds = (ids: string[]) =>
  [
    '// Generated from translations/ by scripts/generate.ts. Do not edit.',
    '',
    '/** Ids of messages that contain markup in any locale. */',
    'export const RICH_MESSAGE_IDS = [',
    ...ids.map((id) => `  ${JSON.stringify(id)},`),
    '] as const;',
    '',
  ].join('\n');

const ARGUMENT_TYPES: Record<ArgumentKind, string> = { number: 'number', value: 'PrimitiveType' };

/**
 * Renders the argument types each message needs.
 *
 * @param entries - Argument kinds for each id with arguments.
 * @returns The source of the generated module.
 */
const _renderMessageArguments = (entries: ReturnType<typeof findMessageArguments>) =>
  [
    '// Generated from translations/ by scripts/generate.ts. Do not edit.',
    '',
    "import type { PrimitiveType } from 'react-intl';",
    '',
    '/** The values each message with arguments needs, keyed by id. */',
    'export interface MessageArguments {',
    ...entries.map(
      ([id, argumentKinds]) =>
        `  ${JSON.stringify(id)}: { ${argumentKinds
          .map(([name, kind]) => `${JSON.stringify(name)}: ${ARGUMENT_TYPES[kind]};`)
          .join(' ')} };`
    ),
    '}',
    '',
  ].join('\n');

/**
 * Formats problems as a readable report.
 *
 * @param problems - The problems from `generateMessages`.
 * @returns A heading followed by one bullet per problem.
 */
export const formatProblems = (problems: string[]): string =>
  [
    'Translations are invalid:',
    ...problems.map((line) => '  - ' + line),
    '',
    'Fix packages/translations/translations/en.json and ja.json. The app updates once the files are valid.',
  ].join('\n');

/**
 * Flattens and validates every locale, then writes the flat files. Nothing is written when a problem is found, so the last good files stay in place.
 *
 * @param options - The source and output folders.
 * @returns The problems found; empty when the files were written.
 */
export function generateMessages(options: GenerateOptions = DEFAULT_GENERATE_OPTIONS): string[] {
  const results = LOCALES.map(
    (locale) => [locale, _readLocale(options.translationsDir, locale)] as const
  );

  const readProblems = results.flatMap(([, result]) =>
    'problem' in result ? [result.problem] : []
  );

  if (readProblems.length > 0) {
    return readProblems;
  }

  const messagesByLocale: Record<string, FlatMessages> = Object.fromEntries(
    results.flatMap(([locale, result]) => ('messages' in result ? [[locale, result.messages]] : []))
  );

  const problems = validateTranslations(messagesByLocale, REFERENCE_LOCALE);

  if (problems.length > 0) {
    return problems;
  }

  const unsupportedTags = findUnsupportedTags(messagesByLocale);

  if (unsupportedTags.length > 0) {
    return unsupportedTags;
  }

  mkdirSync(options.generatedDir, { recursive: true });

  for (const [locale, messages] of Object.entries(messagesByLocale)) {
    _writeIfChanged(
      join(options.generatedDir, `${locale}.json`),
      `${JSON.stringify(messages, null, 2)}\n`
    );
  }

  _writeIfChanged(
    join(options.generatedDir, 'rich-message-ids.ts'),
    _renderRichMessageIds(findRichMessageIds(messagesByLocale))
  );

  _writeIfChanged(
    join(options.generatedDir, 'message-arguments.ts'),
    _renderMessageArguments(findMessageArguments(messagesByLocale[REFERENCE_LOCALE] ?? {}))
  );

  return [];
}
