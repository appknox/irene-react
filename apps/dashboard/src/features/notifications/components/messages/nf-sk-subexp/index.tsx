import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkTypography } from '@irene/ui/ak-typography';
import { formatExpiryDate } from '@/features/notifications/utils';

import type { NfSkSubexpContext } from './context';

/**
 * States when the StoreKnox subscription or trial expires.
 *
 * @param props.context - The values this notification carries.
 */
export function NfSkSubexp({ context }: Readonly<{ context: NfSkSubexpContext }>) {
  const expiryDate = formatExpiryDate(context.subscription_end_date);

  /* A trial expiring is worded differently from a subscription expiring. */
  if (context.is_trial) {
    return (
      <AkTypography data-test-notification-message-body>
        <AkMessageTranslate
          id="notificationModule.messages.nf-sk-subexp-trial"
          values={{ sub_expiry_date: expiryDate }}
        />
      </AkTypography>
    );
  }

  return (
    <AkTypography data-test-notification-message-body>
      <AkMessageTranslate
        id="notificationModule.messages.nf-sk-subexp"
        values={{ sub_expiry_date: expiryDate }}
      />
    </AkTypography>
  );
}
