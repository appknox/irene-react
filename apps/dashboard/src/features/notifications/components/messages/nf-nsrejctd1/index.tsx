import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { DateTimeFormat, formatDateTime } from '@irene/translations/date-time';
import { AkTypography } from '@irene/ui/ak-typography';

import type { NfNsrejctd1Context } from './context';

/**
 * States that the account's own namespace request was rejected.
 *
 * @param props.context - The values this notification carries.
 */
export function NfNsrejctd1({ context }: Readonly<{ context: NfNsrejctd1Context }>) {
  return (
    <AkTypography data-test-notification-message-body>
      <AkMessageTranslate
        id="notificationModule.messages.nf-nsrejctd1"
        values={{
          platform_display: context.platform_display,
          namespace_value: context.namespace_value,
          namespace_created_on: formatDateTime(context.namespace_created_on, DateTimeFormat.LL),
        }}
      />
    </AkTypography>
  );
}
