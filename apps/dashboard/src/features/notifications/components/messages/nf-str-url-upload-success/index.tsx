import { Link } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkTypography } from '@irene/ui/ak-typography';

import {
  NotificationMessageLayout,
  NotificationStoreLink,
  NotificationVersionMeta,
} from '@/features/notifications/components/shared';

import { storeNameForUrl } from '@/features/notifications/utils';

import type { NfStrUrlUploadSuccessContext } from './context';

/**
 * States that an app taken from a store was uploaded and is ready to scan.
 *
 * @param props.context - The values this notification carries.
 */
export function NfStrUrlUploadSuccess({
  context,
}: Readonly<{ context: NfStrUrlUploadSuccessContext }>) {
  return (
    <NotificationMessageLayout spacing="1">
      <AkTypography data-test-notification-message-body>
        <AkMessageTranslate
          id="notificationModule.messages.nf-str-url-upload-success.prefix"
          values={{
            platform_display: context.platform_display,
            package_name: context.package_name,
            store_name: storeNameForUrl(context.store_url),
          }}
        />

        <Link
          to="/dashboard/file/$fileId"
          params={{ fileId: String(context.file_id) }}
          className="mx-0.75 self-start text-primary underline"
        >
          {`${akMT('fileID')} ${context.file_id}`}
        </Link>

        <AkMessageTranslate id="notificationModule.messages.nf-str-url-upload-success.suffix" />
      </AkTypography>

      <NotificationVersionMeta version={context.version} versionCode={context.version_code} />

      <NotificationStoreLink href={context.store_url} />
    </NotificationMessageLayout>
  );
}
