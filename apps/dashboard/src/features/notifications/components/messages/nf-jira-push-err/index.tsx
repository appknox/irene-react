import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';
import { NotificationMessageLayout } from '@/features/notifications/components/shared';

import type { NfJiraPushErrContext } from './context';

/**
 * States that pushing a finding to Jira failed, and why.
 *
 * @param props.context - The values this notification carries.
 */
export function NfJiraPushErr({ context }: Readonly<{ context: NfJiraPushErrContext }>) {
  return (
    <NotificationMessageLayout spacing="1">
      <AkTypography data-test-notification-message-body>
        <AkMessageTranslate
          id="notificationModule.messages.nf-jira-push-err"
          values={{
            file_id: String(context.file_id),
            package_name: context.package_name,
          }}
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
    </NotificationMessageLayout>
  );
}
