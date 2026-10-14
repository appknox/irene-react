import { Link } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkTypography } from '@irene/ui/ak-typography';

import { NotificationMessageLayout } from '@/features/notifications/components/shared';

import type { NfAutomatedDastInProgressContext } from './context';

/**
 * States that an automated dynamic scan has started.
 *
 * @param props.context - The values this notification carries.
 */
export function NfAutomatedDastInProgress({
  context,
}: Readonly<{ context: NfAutomatedDastInProgressContext }>) {
  return (
    <NotificationMessageLayout>
      <AkTypography data-test-notification-message-body>
        <AkMessageTranslate id="notificationModule.messages.nf-automated-dast-in-progress.prefix" />

        <Link
          to="/dashboard/file/$fileId"
          params={{ fileId: String(context.file_id) }}
          className="mx-0.75 self-start text-primary underline"
        >
          {`${akMT('fileID')} ${context.file_id}`}
        </Link>

        <AkMessageTranslate
          id="notificationModule.messages.nf-automated-dast-in-progress.suffix"
          values={{
            platform_display: context.platform,
            package_name: context.package_name,
          }}
        />
      </AkTypography>
    </NotificationMessageLayout>
  );
}
