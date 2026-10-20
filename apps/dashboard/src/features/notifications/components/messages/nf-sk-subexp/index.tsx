import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { DateTimeFormat, formatDateTime } from '@irene/translations/date-time';
import { AkTypography } from '@irene/ui/ak-typography';

import type { NfSkSubexpContext } from './context';

/**
 * States when the StoreKnox subscription or trial expires.
 *
 * @param props.context - The values this notification carries.
 */
export function NfSkSubexp({ context }: Readonly<{ context: NfSkSubexpContext }>) {
  const expiryDate = formatDateTime(context.subscription_end_date, DateTimeFormat.ll);

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
