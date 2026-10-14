import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkTypography } from '@irene/ui/ak-typography';

import type { NfUpldfailpay2Context } from './context';

/**
 * States that another member's upload failed for want of a subscription.
 *
 * @param props.context - The values this notification carries.
 */
export function NfUpldfailpay2({ context }: Readonly<{ context: NfUpldfailpay2Context }>) {
  return (
    <AkTypography data-test-notification-message-body>
      <AkMessageTranslate
        id="notificationModule.messages.nf-upldfailpay2"
        values={{
          package_name: context.package_name,
          requester_username: context.requester_username,
        }}
      />
    </AkTypography>
  );
}
