import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkTypography } from '@irene/ui/ak-typography';

import type { NfPublicApiUserUpdatedContext } from './context';

/**
 * States a change to a public API service account.
 *
 * @param props.context - The values this notification carries.
 */
export function NfPublicApiUserUpdated({
  context,
}: Readonly<{ context: NfPublicApiUserUpdatedContext }>) {
  return (
    <AkTypography data-test-notification-message-body>
      <AkMessageTranslate
        id="notificationModule.messages.nf-public-api-user-updated"
        values={{
          type: context.type,
          user_email: context.user_email,
          current: context.current,
          updated: context.updated,
          changed_by: context.changed_by,
        }}
      />
    </AkTypography>
  );
}
