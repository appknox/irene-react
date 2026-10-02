import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkTypography } from '@irene/ui/ak-typography';

import type { NfNsautoapprvd2Context } from './context';

/**
 * States that another member's namespace was approved automatically.
 *
 * @param props.context - The values this notification carries.
 */
export function NfNsautoapprvd2({ context }: Readonly<{ context: NfNsautoapprvd2Context }>) {
  return (
    <AkTypography data-test-notification-message-body>
      <AkMessageTranslate
        id="notificationModule.messages.nf-nsautoapprvd2"
        values={{
          platform_display: context.platform_display,
          namespace_value: context.namespace_value,
          requester_username: context.requester_username,
        }}
      />
    </AkTypography>
  );
}
