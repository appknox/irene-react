import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkTypography } from '@irene/ui/ak-typography';
import { NotificationNamespaceMessage } from '@/features/notifications/components/namespace-message';

import type { NfNsreqstd1Context } from './context';

/**
 * Asks a moderator to settle a namespace request.
 *
 * @param props.context - The values this notification carries.
 */
export function NfNsreqstd1({ context }: Readonly<{ context: NfNsreqstd1Context }>) {
  return (
    <NotificationNamespaceMessage
      namespaceId={Number(context.namespace_id)}
      storeUrl={context.store_url}
    >
      <AkTypography data-test-notification-message-body>
        <AkMessageTranslate
          id="notificationModule.messages.nf-nsreqstd1"
          values={{
            requester_username: context.requester_username,
            platform_display: context.platform_display,
            namespace_value: context.namespace_value,
          }}
        />
      </AkTypography>
    </NotificationNamespaceMessage>
  );
}
