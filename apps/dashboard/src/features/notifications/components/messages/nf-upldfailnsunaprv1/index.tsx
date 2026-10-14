import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkTypography } from '@irene/ui/ak-typography';

import type { NfUpldfailnsunaprv1Context } from './context';

/**
 * States that an upload failed because its namespace is not approved.
 *
 * @param props.context - The values this notification carries.
 */
export function NfUpldfailnsunaprv1({
  context,
}: Readonly<{ context: NfUpldfailnsunaprv1Context }>) {
  return (
    <AkTypography data-test-notification-message-body>
      <AkMessageTranslate
        id="notificationModule.messages.nf-upldfailnsunaprv1"
        values={{
          platform_display: context.platform_display,
          namespace_value: context.namespace_value,
        }}
      />
    </AkTypography>
  );
}
