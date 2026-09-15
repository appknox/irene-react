import { useIntl } from 'react-intl';
import type { MessageArgumentValues, MessageId } from '@irene/translations/messages';

/** Props whose `values` are required with exactly the message's arguments, and absent when it has none. */
export type AkMessageTranslateProps<Id extends MessageId> = {
  id: Id;
} & (MessageArgumentValues<Id> extends undefined
  ? { values?: undefined }
  : { values: MessageArgumentValues<Id> });

/**
 * Renders a message in the active locale, with markup as elements. A missing, misspelt or extra value fails type-checking.
 *
 * @param props.id - The message id.
 * @param props.values - Values for the message's arguments.
 */
export function AkMessageTranslate<Id extends MessageId>({
  id,
  values,
}: AkMessageTranslateProps<Id>) {
  const intl = useIntl();

  return <>{intl.formatMessage({ id }, values)}</>;
}
