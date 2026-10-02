import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkTypography } from '@irene/ui/ak-typography';

import type { NfNsautoapprvd1Context } from './context';

/**
 * States that a namespace was approved automatically.
 *
 * @param props.context - The values this notification carries.
 */
export function NfNsautoapprvd1({ context }: Readonly<{ context: NfNsautoapprvd1Context }>) {
  return (
    <AkTypography data-test-notification-message-body>
      <AkMessageTranslate
        id="notificationModule.messages.nf-nsautoapprvd1"
        values={{
          platform_display: context.platform_display,
          namespace_value: context.namespace_value,
        }}
      />
    </AkTypography>
  );
}
