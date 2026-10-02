import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkTypography } from '@irene/ui/ak-typography';
import { formatNotificationDate } from '@/features/notifications/utils';

import type { NfNsrejctd1Context } from './context';

/**
 * States that the account's own namespace request was rejected.
 *
 * @param props.context - The values this notification carries.
 */
export function NfNsrejctd1({ context }: Readonly<{ context: NfNsrejctd1Context }>) {
  return (
    <AkTypography data-test-notification-message-body>
      <AkMessageTranslate
        id="notificationModule.messages.nf-nsrejctd1"
        values={{
          platform_display: context.platform_display,
          namespace_value: context.namespace_value,
          namespace_created_on: formatNotificationDate(context.namespace_created_on),
        }}
      />
    </AkTypography>
  );
}
