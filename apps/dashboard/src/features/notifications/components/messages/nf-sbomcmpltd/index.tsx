import { Link } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkTypography } from '@irene/ui/ak-typography';

import {
  NotificationMessageLayout,
  NotificationVersionMeta,
} from '@/features/notifications/components/shared';

import type { NfSbomcmpltdContext } from './context';

/**
 * States that an SBOM was generated, and summarises what it found.
 *
 * @param props.context - The values this notification carries.
 */
export function NfSbomcmpltd({ context }: Readonly<{ context: NfSbomcmpltdContext }>) {
  return (
    <NotificationMessageLayout spacing="1">
      <AkTypography data-test-notification-message-body>
        <AkMessageTranslate id="notificationModule.messages.nf-sbomcmpltd.prefix" />

        <Link
          to="/dashboard/file/$fileId"
          params={{ fileId: String(context.file_id) }}
          className="mx-0.75 self-start text-primary underline"
        >
          {`${akMT('fileID')} ${context.file_id}`}
        </Link>

        <AkMessageTranslate
          id="notificationModule.messages.nf-sbomcmpltd.suffix"
          values={{
            platform_display: context.platform_display,
            file_name: context.file_name,
            package_name: context.package_name,
          }}
        />
      </AkTypography>

      <NotificationVersionMeta version={context.version} versionCode={context.version_code} />

      <div className="my-1.75 flex flex-col gap-1">
        <AkTypography variant="h6">{`${akMT('summary')}:`}</AkTypography>

        <div className="flex flex-wrap gap-x-2.5" data-test-notification-sbom-summary>
          <AkMessageTranslate
            id="notificationModule.messages.nf-sbomcmpltd.summary"
            values={{
              total_components: context.components_count,
              vulnerable_components: context.vulnerable_components_count,
              outdated_components: context.components_with_updates_count,
            }}
          />
        </div>
      </div>

      <Link
        to="/dashboard/sbom/apps/$sbomProjectId/scans/$sbomFileId"
        params={{
          sbomProjectId: String(context.sb_project_id),
          sbomFileId: String(context.sb_file_id),
        }}
        className="self-start text-primary underline"
      >
        <AkMessageTranslate id="notificationModule.viewSBOMResults" />
      </Link>
    </NotificationMessageLayout>
  );
}
