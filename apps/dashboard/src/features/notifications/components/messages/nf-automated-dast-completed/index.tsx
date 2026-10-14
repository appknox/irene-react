import { Link } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkTypography } from '@irene/ui/ak-typography';

import { NotificationMessageLayout } from '@/features/notifications/components/shared';

import type { NfAutomatedDastCompletedContext } from './context';

/**
 * States that an automated dynamic scan finished.
 *
 * @param props.context - The values this notification carries.
 */
export function NfAutomatedDastCompleted({
  context,
}: Readonly<{ context: NfAutomatedDastCompletedContext }>) {
  return (
    <NotificationMessageLayout spacing="1">
      <AkTypography data-test-notification-message-body>
        <AkMessageTranslate id="notificationModule.messages.nf-automated-dast-completed.prefix" />

        <Link
          to="/dashboard/file/$fileId"
          params={{ fileId: String(context.file_id) }}
          className="mx-0.75 self-start text-primary underline"
        >
          {`${akMT('fileID')} ${context.file_id}`}
        </Link>

        <AkMessageTranslate
          id="notificationModule.messages.nf-automated-dast-completed.suffix"
          values={{
            platform_display: context.platform,
            package_name: context.package_name,
          }}
        />
      </AkTypography>

      <Link
        to="/dashboard/file/$fileId/dynamic-scan/results"
        params={{ fileId: String(context.file_id) }}
        className="self-start text-primary underline"
      >
        <AkMessageTranslate id="viewResults" />
      </Link>
    </NotificationMessageLayout>
  );
}
