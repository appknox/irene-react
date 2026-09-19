import { parse, TYPE, type MessageFormatElement } from '@formatjs/icu-messageformat-parser';

import { RICH_TEXT_TAG_NAMES } from '../../shared/rich-text-tags.ts';
import type { FlatMessages } from './flatten.ts';

/**
 * Checks whether a parsed message contains a tag, including inside plural and select options.
 *
 * @param elements - The parsed message.
 * @returns Whether the message has markup.
 */
function _hasTag(elements: MessageFormatElement[]): boolean {
  return elements.some((element) => {
    if (element.type === TYPE.tag) {
      return true;
    }

    if (element.type === TYPE.plural || element.type === TYPE.select) {
      return Object.values(element.options).some((option) => _hasTag(option.value));
    }

    return false;
  });
}

/**
 * Collects the tag names a parsed message uses, including nested tags and tags inside plural and select options.
 *
 * @param elements - The parsed message.
 * @param names - The set to add to.
 * @returns The tag names.
 */
function _collectTagNames(elements: MessageFormatElement[], names = new Set<string>()) {
  for (const element of elements) {
    if (element.type === TYPE.tag) {
      names.add(element.value);
      _collectTagNames(element.children, names);
    } else if (element.type === TYPE.plural || element.type === TYPE.select) {
      Object.values(element.options).forEach((option) => _collectTagNames(option.value, names));
    }
  }

  return names;
}

const SUPPORTED_TAGS: ReadonlySet<string> = new Set(RICH_TEXT_TAG_NAMES);
const SUPPORTED_TAG_LIST = RICH_TEXT_TAG_NAMES.map((name) => `<${name}>`).join(', ');

/**
 * Lists every tag with no renderer, with what to do about it. Expects messages that already passed validation.
 *
 * @param messagesByLocale - Flat messages for each locale.
 * @returns One line per unsupported tag in a message; empty when every tag can render.
 */
export function findUnsupportedTags(messagesByLocale: Record<string, FlatMessages>): string[] {
  return Object.entries(messagesByLocale).flatMap(([locale, messages]) =>
    Object.entries(messages).flatMap(([id, message]) =>
      [..._collectTagNames(parse(message))]
        .filter((name) => !SUPPORTED_TAGS.has(name))
        .map(
          (name) =>
            `${locale}: "${id}" uses <${name}>, which has no renderer. Use one of ${SUPPORTED_TAG_LIST}, ` +
            `or add "${name}" to RICH_TEXT_TAG_NAMES in packages/translations/shared/rich-text-tags.ts ` +
            `and a renderer for it to RICH_TEXT_TAGS in packages/translations/src/rich-text.tsx.`
        )
    )
  );
}

/**
 * Lists the ids whose message contains markup in any locale. Expects messages that already passed validation.
 *
 * @param messagesByLocale - Flat messages for each locale.
 * @returns The ids, sorted.
 */
export function findRichMessageIds(messagesByLocale: Record<string, FlatMessages>): string[] {
  const ids = new Set<string>();

  for (const messages of Object.values(messagesByLocale)) {
    for (const [id, message] of Object.entries(messages)) {
      if (_hasTag(parse(message))) {
        ids.add(id);
      }
    }
  }

  return [...ids].sort((a, b) => a.localeCompare(b));
}
