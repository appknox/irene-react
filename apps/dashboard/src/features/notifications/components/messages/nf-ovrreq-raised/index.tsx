import { Link } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkButton } from '@irene/ui/ak-button';
import { AkTypography } from '@irene/ui/ak-typography';

import { NotificationMessageLayout } from '@/features/notifications/components/shared';

import type { NfOvrreqRaisedContext } from './context';

/**
 * States that a member asked for a finding's risk to be overridden.
 *
 * @param props.context - The values this notification carries.
 */
export function NfOvrreqRaised({ context }: Readonly<{ context: NfOvrreqRaisedContext }>) {
  return (
    <NotificationMessageLayout spacing="1.5" className="pb-1.75">
      <AkTypography data-test-notification-message-body>
        <AkMessageTranslate
          id="notificationModule.messages.nf-ovrreq-raised"
          values={{
            requester_email: context.requester_email,
          }}
        />
      </AkTypography>

      <Link
        to="/dashboard/file/$fileId/analysis/$analysisId"
        params={{ fileId: String(context.file_id), analysisId: String(context.analysis_id) }}
        className="self-start"
      >
        <AkButton variant="outlined" color="neutral">
          <AkMessageTranslate id="viewRequest" />
        </AkButton>
      </Link>
    </NotificationMessageLayout>
  );
}
