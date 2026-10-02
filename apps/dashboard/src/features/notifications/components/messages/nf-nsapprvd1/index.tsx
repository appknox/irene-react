import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkTypography } from '@irene/ui/ak-typography';
import { formatNotificationDate } from '@/features/notifications/utils';

import type { NfNsapprvd1Context } from './context';

/**
 * States that a namespace request was approved, to the moderator who approved it.
 *
 * @param props.context - The values this notification carries.
 */
export function NfNsapprvd1({ context }: Readonly<{ context: NfNsapprvd1Context }>) {
  return (
    <AkTypography data-test-notification-message-body>
      <AkMessageTranslate
        id="notificationModule.messages.nf-nsapprvd1"
        values={{
          platform_display: context.platform_display,
          namespace_value: context.namespace_value,
          namespace_created_on: formatNotificationDate(context.namespace_created_on),
          moderator_username: context.moderator_username,
        }}
      />
    </AkTypography>
  );
}
