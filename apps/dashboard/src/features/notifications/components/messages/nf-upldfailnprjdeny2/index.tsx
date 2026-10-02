import { Link } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkTypography } from '@irene/ui/ak-typography';

import { NotificationMessageLayout } from '@/features/notifications/components/shared';

import type { NfUpldfailnprjdeny2Context } from './context';

/**
 * States that another member's upload failed for want of project access, and where to grant it.
 *
 * @param props.context - The values this notification carries.
 */
export function NfUpldfailnprjdeny2({
  context,
}: Readonly<{ context: NfUpldfailnprjdeny2Context }>) {
  return (
    <NotificationMessageLayout>
      <AkTypography data-test-notification-message-body>
        <AkMessageTranslate
          id="notificationModule.messages.nf-upldfailnprjdeny2.primary"
          values={{
            platform_display: context.platform_display,
            package_name: context.package_name,
            requester_username: context.requester_username,
            requester_role: context.requester_role,
          }}
        />
      </AkTypography>

      <AkTypography className="text-neutral-500">
        <em>{`(${akMT('notificationModule.messages.nf-upldfailnprjdeny2.secondary')})`}</em>
      </AkTypography>

      <Link
        to="/dashboard/project/$projectId/settings"
        params={{ projectId: String(context.project_id) }}
        className="pt-1.75 self-start text-primary underline"
      >
        <AkMessageTranslate id="notificationModule.projectSettings" />
      </Link>
    </NotificationMessageLayout>
  );
}
