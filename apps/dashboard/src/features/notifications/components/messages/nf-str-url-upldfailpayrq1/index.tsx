import {
  NotificationMessageLayout,
  NotificationStoreLink,
} from '@/features/notifications/components/shared';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkTypography } from '@irene/ui/ak-typography';
import { storeNameForUrl } from '@/features/notifications/utils';

import type { NfStrUrlUpldfailpayrq1Context } from './context';

/**
 * States that a store upload failed for want of a subscription.
 *
 * @param props.context - The values this notification carries.
 */
export function NfStrUrlUpldfailpayrq1({
  context,
}: Readonly<{ context: NfStrUrlUpldfailpayrq1Context }>) {
  return (
    <NotificationMessageLayout spacing="1">
      <AkTypography data-test-notification-message-body>
        <AkMessageTranslate
          id="notificationModule.messages.nf-str-url-upldfailpayrq1"
          values={{ store_name: storeNameForUrl(context.store_url) }}
        />
      </AkTypography>

      <NotificationStoreLink href={context.store_url} />
    </NotificationMessageLayout>
  );
}
