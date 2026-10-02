import { Link } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkTypography } from '@irene/ui/ak-typography';

import { NotificationMessageLayout } from '@/features/notifications/components/shared';

import type { NfAutomatedDastErroredContext } from './context';

/**
 * States that an automated dynamic scan failed, and offers the manual scan instead.
 *
 * @param props.context - The values this notification carries.
 */
export function NfAutomatedDastErrored({
  context,
}: Readonly<{ context: NfAutomatedDastErroredContext }>) {
  return (
    <NotificationMessageLayout>
      <AkTypography data-test-notification-message-body>
        <AkMessageTranslate id="notificationModule.messages.nf-automated-dast-errored.prefix" />

        <Link
          to="/dashboard/file/$fileId"
          params={{ fileId: String(context.file_id) }}
          className="mx-0.75 self-start text-primary underline"
        >
          {`${akMT('fileID')} ${context.file_id}`}
        </Link>

        <AkMessageTranslate
          id="notificationModule.messages.nf-automated-dast-errored.suffix"
          values={{
            platform_display: context.platform,
            package_name: context.package_name,
            error_message: context.error_message,
          }}
        />

        <Link
          to="/dashboard/file/$fileId/dynamic-scan/manual"
          params={{ fileId: String(context.file_id) }}
          className="self-start text-primary underline"
        >
          <AkMessageTranslate id="here" />
        </Link>
      </AkTypography>
    </NotificationMessageLayout>
  );
}
