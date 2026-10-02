import { Link } from '@tanstack/react-router';
import { Fragment } from 'react';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkTypography } from '@irene/ui/ak-typography';

import {
  NotificationMessageLayout,
  NotificationStoreLink,
} from '@/features/notifications/components/shared';

import type { NfStrUrlUpldfailnprjdeny2Context } from './context';

/**
 * States that another member's store upload failed for want of project access.
 *
 * @param props.context - The values this notification carries.
 */
export function NfStrUrlUpldfailnprjdeny2({
  context,
}: Readonly<{ context: NfStrUrlUpldfailnprjdeny2Context }>) {
  return (
    <NotificationMessageLayout spacing="1">
      <div>
        <AkTypography data-test-notification-message-body>
          <AkMessageTranslate
            id="notificationModule.messages.nf-str-url-upldfailnprjdeny2.primary"
            values={{
              platform_display: context.platform_display,
              package_name: context.package_name,
              requester_username: context.requester_username,
              requester_role: context.requester_role,
            }}
          />
        </AkTypography>

        <AkTypography color="textSecondary">
          <em>
            {`(${akMT('notificationModule.messages.nf-str-url-upldfailnprjdeny2.secondary')})`}
          </em>
        </AkTypography>
      </div>

      <div className="flex items-center gap-2.5">
        <Link
          to="/dashboard/project/$projectId/settings"
          params={{ projectId: String(context.project_id) }}
          className="self-start text-primary underline"
        >
          <AkMessageTranslate id="notificationModule.projectSettings" />
        </Link>

        {/* The store listing is only carried when the upload came from a store. */}
        {context.store_url && (
          <Fragment>
            <span className="text-neutral-200">|</span>

            <NotificationStoreLink href={context.store_url} />
          </Fragment>
        )}
      </div>
    </NotificationMessageLayout>
  );
}
