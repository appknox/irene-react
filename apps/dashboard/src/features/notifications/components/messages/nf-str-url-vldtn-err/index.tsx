import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';

import {
  NotificationMessageLayout,
  NotificationStoreLink,
} from '@/features/notifications/components/shared';

import { storeNameForUrl } from '@/features/notifications/utils';

import type { NfStrUrlVldtnErrContext } from './context';

/**
 * States that a store listing could not be validated, and why.
 *
 * @param props.context - The values this notification carries.
 */
export function NfStrUrlVldtnErr({ context }: Readonly<{ context: NfStrUrlVldtnErrContext }>) {
  return (
    <NotificationMessageLayout spacing="1">
      <AkTypography data-test-notification-message-body>
        <AkMessageTranslate
          id="notificationModule.messages.nf-str-url-vldtn-err"
          values={{ store_name: storeNameForUrl(context.store_url) }}
        />
      </AkTypography>

      <div
        className="my-1.75 max-w-140 rounded-xs border border-divider-strong px-4.25 py-3.5"
        data-test-notification-error
      >
        <span className="flex items-center gap-1">
          <AkIcon name="material-symbols:warning" className="size-4 text-danger" />

          <AkTypography variant="subtitle2">
            <AkMessageTranslate id="errorMessage" />
          </AkTypography>
        </span>

        {/* Clamped: a stack trace the server passes through would fill the panel. */}
        <AkTypography className="mt-1.75 line-clamp-3">{context.error_message}</AkTypography>
      </div>

      <NotificationStoreLink href={context.store_url} />
    </NotificationMessageLayout>
  );
}
