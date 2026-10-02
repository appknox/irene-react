import { Link } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkTypography } from '@irene/ui/ak-typography';
import { NotificationMessageLayout } from '@/features/notifications/components/shared';

import type { NfSkNewversnContext } from './context';

/**
 * States that StoreKnox found an app version nobody has scanned.
 *
 * @param props.context - The values this notification carries.
 */
export function NfSkNewversn({ context }: Readonly<{ context: NfSkNewversnContext }>) {
  return (
    <NotificationMessageLayout>
      <AkTypography data-test-notification-message-body>
        <AkMessageTranslate
          id="notificationModule.messages.nf-sk-newversn"
          values={{
            platform_display: context.platform_display,
            app_name: context.app_name,
            package_name: context.package_name,
            version_unscanned: context.version_unscanned,
          }}
        />
      </AkTypography>

      <Link
        to="/dashboard/storeknox/inventory-details/$id/unscanned-version"
        params={{ id: String(context.sk_app_id) }}
        className="pt-1.75 self-start text-primary underline"
      >
        <AkMessageTranslate id="notificationModule.viewMonitoringResults" />
      </Link>
    </NotificationMessageLayout>
  );
}
