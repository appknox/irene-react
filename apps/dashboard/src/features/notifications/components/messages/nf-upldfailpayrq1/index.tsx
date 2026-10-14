import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkTypography } from '@irene/ui/ak-typography';

import type { NfUpldfailpayrq1Context } from './context';

/**
 * States that an upload failed for want of a subscription.
 *
 * @param props.context - The values this notification carries.
 */
export function NfUpldfailpayrq1({ context }: Readonly<{ context: NfUpldfailpayrq1Context }>) {
  return (
    <AkTypography data-test-notification-message-body>
      <AkMessageTranslate
        id="notificationModule.messages.nf-upldfailpayrq1"
        values={{ package_name: context.package_name }}
      />
    </AkTypography>
  );
}
