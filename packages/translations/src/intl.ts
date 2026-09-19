import { createIntl, createIntlCache, type IntlShape, type PrimitiveType } from 'react-intl';
import type { ReactNode } from 'react';

import {
  DEFAULT_MESSAGES,
  loadMessages,
  type MessageId,
  type Messages,
  type MessageValues,
  type TranslatedMessage,
} from '@irene/translations/messages';

import { DEFAULT_LOCALE, type Locale } from '@irene/translations/locale';

import { FORMATS } from './formats.ts';
import { RICH_TEXT_TAGS } from './rich-text.tsx';

type Listener = () => void;

const cache = createIntlCache();
const listeners = new Set<Listener>();

let currentLocale: Locale = DEFAULT_LOCALE;
let current: IntlShape = _buildIntl(DEFAULT_LOCALE, DEFAULT_MESSAGES);
let latestRequest = 0;

/**
 * Surfaces a missing message or bad arguments. Throws in development and tests so the mistake is fixed, logs in production.
 *
 * @param error - The error react-intl reports.
 */
function _reportError(error: Error) {
  if (import.meta.env.DEV) {
    throw error;
  }

  console.error(error);
}

/**
 * Builds the intl object for one locale.
 *
 * @param locale - The locale.
 * @param messages - Its messages.
 * @returns The intl object components and plain code format with.
 */
function _buildIntl(locale: Locale, messages: Messages): IntlShape {
  return createIntl(
    {
      locale,
      messages,
      formats: FORMATS,
      defaultLocale: DEFAULT_LOCALE,
      onError: _reportError,

      // Renders markup in any message without each call site passing the tags.
      defaultRichTextElements: RICH_TEXT_TAGS,

      /*
        Messages ship as ICU strings rather than a pre-compiled AST, which costs
        ~4KB gzipped per locale to change and buys only a parse that is memoised
        on first use. react-intl warns about the combination; this is the sole
        thing it sends to onWarn, so silencing it hides nothing else. Revisit if
        an upgrade starts reporting anything more through this channel.
      */
      onWarn: () => undefined,
    },
    cache
  );
}

/**
 * Returns the intl object for the active locale. Use it outside components, e.g. in loaders and toasts.
 *
 * @returns The active intl object.
 */
export const getIntl = (): IntlShape => current;

/**
 * Returns the active locale.
 *
 * @returns The locale messages currently render in.
 */
export const getLocale = (): Locale => currentLocale;

/**
 * Formats a message in the active locale. A message with markup renders as React nodes, e.g.
 * `{akMT('capturedApiEmptyDesc')}` in JSX; a plain message is a string usable anywhere.
 *
 * @param id - The message id.
 * @param values - Values for the message's arguments, required with exactly its argument names when it has any.
 * @returns The formatted message.
 */
export function akMT<Id extends MessageId>(
  id: Id,
  ...values: MessageValues<Id>
): TranslatedMessage<Id>;

export function akMT(id: MessageId, values?: Record<string, PrimitiveType>): ReactNode {
  return current.formatMessage({ id }, values);
}

/**
 * Registers a callback for locale changes, e.g. to switch the date library's locale too.
 *
 * @param listener - Called after every change.
 * @returns A function that removes the listener.
 */
export function subscribeToLocale(listener: Listener): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

/**
 * Switches the active locale, loading its messages first. When calls overlap, the last one wins.
 *
 * @param locale - The locale to switch to.
 */
export async function setLocale(locale: Locale): Promise<void> {
  const request = ++latestRequest;
  const messages = await loadMessages(locale);

  // A later call started while this one loaded, so its locale takes precedence.
  if (request !== latestRequest) {
    return;
  }

  currentLocale = locale;
  current = _buildIntl(locale, messages);
  listeners.forEach((listener) => listener());
}
