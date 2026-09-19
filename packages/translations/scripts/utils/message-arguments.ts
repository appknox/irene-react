import { parse, TYPE, type MessageFormatElement } from '@formatjs/icu-messageformat-parser';
import type { FlatMessages } from './flatten.ts';

/** How a message reads an argument: a plural needs a number, anything else takes any value. */
export type ArgumentKind = 'number' | 'value';

/**
 * Collects the arguments a parsed message reads, including inside tags, plurals and selects.
 *
 * @param elements - The parsed message.
 * @param kinds - The map to add to.
 * @returns Each argument's name and kind. A name used both as a plural and as plain text needs a number.
 */
function _collectArguments(
  elements: MessageFormatElement[],
  kinds = new Map<string, ArgumentKind>()
) {
  for (const element of elements) {
    if (element.type === TYPE.tag) {
      _collectArguments(element.children, kinds);
    } else if (element.type === TYPE.plural) {
      kinds.set(element.value, 'number');
      Object.values(element.options).forEach((option) => _collectArguments(option.value, kinds));
    } else if (element.type === TYPE.select) {
      kinds.set(element.value, kinds.get(element.value) ?? 'value');
      Object.values(element.options).forEach((option) => _collectArguments(option.value, kinds));
    } else if (element.type !== TYPE.literal && element.type !== TYPE.pound) {
      kinds.set(element.value, kinds.get(element.value) ?? 'value');
    }
  }

  return kinds;
}

/**
 * Lists the arguments each message needs. Expects messages that already passed validation, so every locale reads the same names.
 *
 * @param messages - The reference locale's flat messages.
 * @returns Argument kinds keyed by name, for each id that has arguments, sorted by id and name.
 */
export function findMessageArguments(messages: FlatMessages): [string, [string, ArgumentKind][]][] {
  return Object.entries(messages)
    .map(([id, message]): [string, [string, ArgumentKind][]] => [
      id,
      [..._collectArguments(parse(message))].sort(([a], [b]) => a.localeCompare(b)),
    ])
    .filter(([, argumentKinds]) => argumentKinds.length > 0)
    .sort(([a], [b]) => a.localeCompare(b));
}
