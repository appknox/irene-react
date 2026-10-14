import {
  NotificationMessageLayout,
  NotificationStoreLink,
} from '@/features/notifications/components/shared';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkTypography } from '@irene/ui/ak-typography';
import { storeNameForUrl } from '@/features/notifications/utils';

import type { NfStrUrlUpldfailpay2Context } from './context';

/**
 * States that another member's store upload failed for want of a subscription.
 *
 * @param props.context - The values this notification carries.
 */
export function NfStrUrlUpldfailpay2({
  context,
}: Readonly<{ context: NfStrUrlUpldfailpay2Context }>) {
  return (
    <NotificationMessageLayout spacing="1">
      <AkTypography data-test-notification-message-body>
        <AkMessageTranslate
          id="notificationModule.messages.nf-str-url-upldfailpay2"
          values={{
            package_name: context.package_name,
            requester_username: context.requester_username,
            store_name: storeNameForUrl(context.store_url),
          }}
        />
      </AkTypography>

      <NotificationStoreLink href={context.store_url} />
    </NotificationMessageLayout>
  );
}
