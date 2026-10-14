import { Link } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkButton } from '@irene/ui/ak-button';
import { AkTypography } from '@irene/ui/ak-typography';

import { NotificationMessageLayout } from '@/features/notifications/components/shared';

import type { NfOvrreqApprovedReqstrContext } from './context';

/**
 * States that the account's own override request was approved.
 *
 * @param props.context - The values this notification carries.
 */
export function NfOvrreqApprovedReqstr({
  context,
}: Readonly<{ context: NfOvrreqApprovedReqstrContext }>) {
  return (
    <NotificationMessageLayout spacing="1.5" className="pb-1.75">
      <AkTypography data-test-notification-message-body>
        <AkMessageTranslate
          id="notificationModule.messages.nf-ovrreq-approved-reqstr"
          values={{
            reviewer_email: context.reviewer_email,
          }}
        />
      </AkTypography>

      <Link
        to="/dashboard/file/$fileId/analysis/$analysisId"
        params={{ fileId: String(context.file_id), analysisId: String(context.analysis_id) }}
        className="self-start"
      >
        <AkButton variant="outlined" color="neutral">
          <AkMessageTranslate id="viewVulnerabilityDetails" />
        </AkButton>
      </Link>
    </NotificationMessageLayout>
  );
}
