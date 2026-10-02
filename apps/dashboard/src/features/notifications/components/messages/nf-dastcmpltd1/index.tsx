import { Link } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkTypography } from '@irene/ui/ak-typography';

import {
  NotificationMessageLayout,
  NotificationRiskCountList,
  NotificationVersionMeta,
} from '@/features/notifications/components/shared';

import type { NfDastcmpltd1Context } from './context';

/**
 * States that a dynamic scan finished, and how the file now scores.
 *
 * @param props.context - The values this notification carries.
 */
export function NfDastcmpltd1({ context }: Readonly<{ context: NfDastcmpltd1Context }>) {
  return (
    <NotificationMessageLayout>
      <AkTypography data-test-notification-message-body>
        <AkMessageTranslate
          id="notificationModule.messages.nf-dastcmpltd1"
          values={{
            platform_display: context.platform_display,
            file_name: context.file_name,
            package_name: context.package_name,
          }}
        />
      </AkTypography>

      <NotificationVersionMeta
        version={context.version}
        versionCode={context.version_code}
        className="pt-1.75"
      />

      <NotificationRiskCountList
        title={akMT('notificationModule.currentRiskStatusFile')}
        counts={context}
      />

      <Link
        to="/dashboard/file/$fileId"
        params={{ fileId: String(context.file_id) }}
        className="self-start text-primary underline"
      >
        {`${akMT('viewFile')}: ${context.file_id}`}
      </Link>
    </NotificationMessageLayout>
  );
}
