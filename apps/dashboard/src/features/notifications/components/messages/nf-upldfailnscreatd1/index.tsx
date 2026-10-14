import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkTypography } from '@irene/ui/ak-typography';

import type { NfUpldfailnscreatd1Context } from './context';

/**
 * States that an upload failed because its namespace had to be created first.
 *
 * @param props.context - The values this notification carries.
 */
export function NfUpldfailnscreatd1({
  context,
}: Readonly<{ context: NfUpldfailnscreatd1Context }>) {
  return (
    <AkTypography data-test-notification-message-body>
      <AkMessageTranslate
        id="notificationModule.messages.nf-upldfailnscreatd1"
        values={{
          platform_display: context.platform_display,
          namespace_value: context.namespace_value,
        }}
      />
    </AkTypography>
  );
}
