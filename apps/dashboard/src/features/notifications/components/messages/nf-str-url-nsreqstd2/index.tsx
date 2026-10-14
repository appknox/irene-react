import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkTypography } from '@irene/ui/ak-typography';
import { NotificationNamespaceMessage } from '@/features/notifications/components/namespace-message';
import { formatNotificationDate } from '@/features/notifications/utils';

import type { NfStrUrlNsreqstd2Context } from './context';

/**
 * Asks a moderator to settle a store namespace a second member has now also asked for.
 *
 * @param props.context - The values this notification carries.
 */
export function NfStrUrlNsreqstd2({ context }: Readonly<{ context: NfStrUrlNsreqstd2Context }>) {
  return (
    <NotificationNamespaceMessage namespaceId={context.namespace_id} storeUrl={context.store_url}>
      <AkTypography data-test-notification-message-body>
        <AkMessageTranslate
          id="notificationModule.messages.nf-str-url-nsreqstd2"
          values={{
            current_requester_username: context.current_requester_username,
            initial_requester_username: context.initial_requester_username,
            platform_display: context.platform_display,
            namespace_value: context.namespace_value,
            namespace_created_on: formatNotificationDate(context.namespace_created_on),
          }}
        />
      </AkTypography>
    </NotificationNamespaceMessage>
  );
}
