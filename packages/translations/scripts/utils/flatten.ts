/** A translation file as authored: messages nested under dotted-key segments. */
export interface MessageTree {
  [key: string]: string | string[] | MessageTree;
}

/** Messages keyed by their full dotted id. */
export type FlatMessages = Record<string, string>;

// Skips a break that is already closed.
const LINE_BREAK = /<br\s*\/?>(?!<\/br>)/gi;

/**
 * Rewrites `<br>` and `<br/>` as `<br></br>`, since the ICU parser rejects unclosed tags.
 *
 * @param message - The message as authored.
 * @returns The message with every line break closed.
 */
export const closeLineBreaks = (message: string): string =>
  message.replace(LINE_BREAK, '<br></br>');

/**
 * Flattens a nested translation file into dotted ids. Array items get their index as the last segment.
 *
 * @param tree - The parsed translation file.
 * @param prefix - The id segments above this level.
 * @returns Every message keyed by its full id, with line breaks closed.
 */
export function flattenMessages(tree: MessageTree, prefix = ''): FlatMessages {
  const messages: FlatMessages = {};

  for (const [key, value] of Object.entries(tree)) {
    const id = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      messages[id] = closeLineBreaks(value);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => (messages[`${id}.${index}`] = closeLineBreaks(item)));
    } else {
      Object.assign(messages, flattenMessages(value, id));
    }
  }

  return messages;
}
