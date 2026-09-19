import type { ReactNode } from 'react';

import type { Locale } from '@irene/translations/locale';

import en from './generated/en.json';
import { RICH_MESSAGE_IDS } from './generated/rich-message-ids.ts';
import type { MessageArguments } from './generated/message-arguments.ts';

/** Every message, keyed by id. English is the reference, so its ids are the full set. */
export type Messages = typeof en;

/** Any message id. A typo fails type-checking. */
export type MessageId = Extract<keyof Messages, string>;

/** Ids of messages that contain markup, so they format to React nodes rather than a string. */
export type RichMessageId = (typeof RICH_MESSAGE_IDS)[number];

/** Ids of messages without markup, which always format to a string. */
export type PlainMessageId = Exclude<MessageId, RichMessageId>;

/**
 * The values argument a message takes: required with exactly its argument names when it has arguments, absent otherwise.
 * A missing, misspelt or extra argument fails type-checking.
 */
/** What a message formats to: React nodes when it has markup, a string otherwise. */
export type TranslatedMessage<Id extends MessageId> = Id extends RichMessageId ? ReactNode : string;

/** The values a message needs, or undefined when it has no arguments. */
export type MessageArgumentValues<Id extends MessageId> = Id extends keyof MessageArguments
  ? MessageArguments[Id]
  : undefined;

export type MessageValues<Id extends MessageId> = Id extends keyof MessageArguments
  ? [values: MessageArguments[Id]]
  : [];

// Narrows react-intl's message ids to the shipped messages, wherever this module is loaded.
declare global {
  namespace FormatjsIntl {
    interface Message {
      ids: MessageId;
    }
  }
}

/**
 * Loads a locale's messages. English ships in the main bundle; other locales download on first use.
 *
 * @param locale - The locale to load.
 * @returns The locale's messages.
 */
export async function loadMessages(locale: Locale): Promise<Messages> {
  if (locale === 'ja') {
    return (await import('./generated/ja.json')).default;
  }

  return en;
}

export const DEFAULT_MESSAGES: Messages = en;
