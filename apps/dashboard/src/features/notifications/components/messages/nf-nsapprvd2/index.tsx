import { Link } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkTypography } from '@irene/ui/ak-typography';
import { NotificationMessageLayout } from '@/features/notifications/components/shared';

import type { NfNsapprvd2Context } from './context';

/**
 * States that another member's namespace request was approved.
 *
 * @param props.context - The values this notification carries.
 */
export function NfNsapprvd2({ context }: Readonly<{ context: NfNsapprvd2Context }>) {
  return (
    <NotificationMessageLayout>
      <AkTypography data-test-notification-message-body>
        <AkMessageTranslate
          id="notificationModule.messages.nf-nsapprvd2"
          values={{
            platform_display: context.platform_display,
            namespace_value: context.namespace_value,
            requester_username: context.requester_username,
            moderator_username: context.moderator_username,
          }}
        />
      </AkTypography>

      <Link
        to="/dashboard/organization/namespaces"
        className="pt-1.75 self-start text-primary underline"
      >
        <AkMessageTranslate id="notificationModule.viewNamespaces" />
      </Link>
    </NotificationMessageLayout>
  );
}
