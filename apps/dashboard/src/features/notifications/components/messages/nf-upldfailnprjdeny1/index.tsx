import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkTypography } from '@irene/ui/ak-typography';

import type { NfUpldfailnprjdeny1Context } from './context';

/**
 * States that an upload failed because the account has no access to the project.
 *
 * @param props.context - The values this notification carries.
 */
export function NfUpldfailnprjdeny1({
  context,
}: Readonly<{ context: NfUpldfailnprjdeny1Context }>) {
  return (
    <AkTypography data-test-notification-message-body>
      <AkMessageTranslate
        id="notificationModule.messages.nf-upldfailnprjdeny1"
        values={{
          platform_display: context.platform_display,
          package_name: context.package_name,
        }}
      />
    </AkTypography>
  );
}
