import { parse, TYPE, type MessageFormatElement } from '@formatjs/icu-messageformat-parser';
import type { FlatMessages } from './flatten.ts';

/**
 * Collects the argument names a parsed message reads, including those inside plurals, selects and tags.
 *
 * @param elements - The parsed message.
 * @param names - The set to add to.
 * @returns The argument names.
 */
function _collectArgumentNames(elements: MessageFormatElement[], names = new Set<string>()) {
  for (const element of elements) {
    if (element.type === TYPE.literal || element.type === TYPE.pound) {
      continue;
    }

    if (element.type === TYPE.tag) {
      _collectArgumentNames(element.children, names);
      continue;
    }

    names.add(element.value);

    if (element.type === TYPE.plural || element.type === TYPE.select) {
      for (const option of Object.values(element.options)) {
        _collectArgumentNames(option.value, names);
      }
    }
  }

  return names;
}

/**
 * Parses a message and reads its argument names.
 *
 * @param message - The ICU message.
 * @returns The sorted argument names, or the parser's error message when it does not parse.
 */
function _readArguments(message: string): { names: string } | { error: string } {
  try {
    return {
      names: [..._collectArgumentNames(parse(message))]
        .sort((a, b) => a.localeCompare(b))
        .join(', '),
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'unparsable' };
  }
}

/**
 * Lists ids a locale has that the reference lacks.
 *
 * @param locale - The locale being checked.
 * @param messages - Its messages.
 * @param reference - The reference locale's messages.
 * @param referenceLocale - The reference locale's name.
 * @returns One line per extra id.
 */
const _findExtraIds = (
  locale: string,
  messages: FlatMessages,
  reference: FlatMessages,
  referenceLocale: string
) =>
  Object.keys(messages)
    .filter((id) => !(id in reference))
    .map((id) => `${locale}: "${id}" is not in ${referenceLocale}`);

/**
 * Checks one message against the reference: present, parses, and reads the same arguments.
 *
 * @param locale - The locale being checked.
 * @param id - The message id.
 * @param message - The message, or undefined when the locale lacks it.
 * @param referenceMessage - The reference locale's message.
 * @param referenceLocale - The reference locale's name.
 * @returns The problem, or undefined when the message is sound.
 */
function _checkMessage(
  locale: string,
  id: string,
  message: string | undefined,
  referenceMessage: string,
  referenceLocale: string
): string | undefined {
  if (message === undefined) {
    return `${locale}: "${id}" is missing`;
  }

  const parsed = _readArguments(message);

  if ('error' in parsed) {
    return `${locale}: "${id}" does not parse (${parsed.error})`;
  }

  const expected = _readArguments(referenceMessage);

  if ('names' in expected && expected.names !== parsed.names) {
    return `${locale}: "${id}" uses arguments [${parsed.names}], ${referenceLocale} uses [${expected.names}]`;
  }

  return undefined;
}

/**
 * Checks every locale against the reference locale: same ids, every message parses, same arguments per id.
 *
 * @param messagesByLocale - Flat messages for each locale.
 * @param referenceLocale - The locale the others must match.
 * @returns One line per problem; empty when the translations are sound.
 */
export function validateTranslations(
  messagesByLocale: Record<string, FlatMessages>,
  referenceLocale: string
): string[] {
  const reference = messagesByLocale[referenceLocale] ?? {};

  return Object.entries(messagesByLocale).flatMap(([locale, messages]) => [
    ..._findExtraIds(locale, messages, reference, referenceLocale),
    ...Object.entries(reference)
      .map(([id, referenceMessage]) =>
        _checkMessage(locale, id, messages[id], referenceMessage, referenceLocale)
      )
      .filter((problem) => problem !== undefined),
  ]);
}
