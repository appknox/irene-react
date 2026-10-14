import { Link } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkTypography } from '@irene/ui/ak-typography';

import { NotificationMessageLayout } from '@/features/notifications/components/shared';

import type { NfOvrreqRejectedContext } from './context';

/**
 * States that an override request was rejected, and the reviewer's reasoning.
 *
 * @param props.context - The values this notification carries.
 */
export function NfOvrreqRejected({ context }: Readonly<{ context: NfOvrreqRejectedContext }>) {
  return (
    <NotificationMessageLayout spacing="2">
      <AkTypography data-test-notification-message-body>
        <AkMessageTranslate
          id="notificationModule.messages.nf-ovrreq-rejected"
          values={{
            reviewer_email: context.reviewer_email,
          }}
        />
      </AkTypography>

      <div className="flex flex-col gap-1">
        <AkTypography fontWeight="bold">{akMT('reasoningToReject')}</AkTypography>

        <AkTypography data-test-notification-rejection-reason>
          {context.rejection_reason}
        </AkTypography>
      </div>

      <Link
        to="/dashboard/file/$fileId/analysis/$analysisId"
        params={{ fileId: String(context.file_id), analysisId: String(context.analysis_id) }}
        className="font-medium self-start text-primary underline"
      >
        <AkMessageTranslate id="viewTheVulnerability" />
      </Link>
    </NotificationMessageLayout>
  );
}
