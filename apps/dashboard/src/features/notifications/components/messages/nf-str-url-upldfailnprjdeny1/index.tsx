import {
  NotificationMessageLayout,
  NotificationStoreLink,
} from '@/features/notifications/components/shared';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkTypography } from '@irene/ui/ak-typography';
import { storeNameForUrl } from '@/features/notifications/utils';

import type { NfStrUrlUpldfailnprjdeny1Context } from './context';

/**
 * States that a store upload failed because the account has no access to the project.
 *
 * @param props.context - The values this notification carries.
 */
export function NfStrUrlUpldfailnprjdeny1({
  context,
}: Readonly<{ context: NfStrUrlUpldfailnprjdeny1Context }>) {
  return (
    <NotificationMessageLayout spacing="1">
      <AkTypography data-test-notification-message-body>
        <AkMessageTranslate
          id="notificationModule.messages.nf-str-url-upldfailnprjdeny1"
          values={{
            package_name: context.package_name,
            store_name: storeNameForUrl(context.store_url),
          }}
        />
      </AkTypography>

      <NotificationStoreLink href={context.store_url} />
    </NotificationMessageLayout>
  );
}
