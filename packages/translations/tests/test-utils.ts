import { isValidElement, type ReactNode } from 'react';

/**
 * Flattens a formatted message to the text it renders as.
 *
 * A message carrying rich-text tags formats to React nodes rather than a string,
 * so a test asserting the message's whole text reduces the nodes to the text they
 * contain, which is what `toHaveTextContent` takes.
 *
 * @param message - A message formatted by `akMT`.
 * @returns The message as one string.
 */
export function textForRichTextMessage(message: ReactNode): string {
  if (typeof message === 'string' || typeof message === 'number') {
    return String(message);
  }

  if (Array.isArray(message)) {
    return message.map(textForRichTextMessage).join('');
  }

  if (isValidElement(message)) {
    return textForRichTextMessage((message.props as { children?: ReactNode }).children);
  }

  return '';
}
