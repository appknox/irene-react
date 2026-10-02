import { Link } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkTypography } from '@irene/ui/ak-typography';

import { NotificationMessageLayout } from '@/features/notifications/components/shared';
import { sbomComponentNameWithoutRegistry } from '@/features/notifications/utils';

import type { NfSbomCompUpdateContext } from './context';

/**
 * States that a component a scanned app depends on has a newer version.
 *
 * @param props.context - The values this notification carries.
 */
export function NfSbomCompUpdate({ context }: Readonly<{ context: NfSbomCompUpdateContext }>) {
  return (
    <NotificationMessageLayout spacing="1.5">
      <AkTypography data-test-notification-message-body>
        <AkMessageTranslate id="notificationModule.messages.nf-sbom-comp-update" />
      </AkTypography>

      {/* The component and its details share one bordered block. */}
      <div
        className="w-full overflow-hidden rounded-xs border border-divider-strong"
        data-test-notification-component-card
      >
        <AkTypography
          tag="p"
          className="bg-neutral-50 px-3.25 py-1.75 font-mono text-sm break-all"
          fontWeight="bold"
          data-test-notification-component-name
        >
          {sbomComponentNameWithoutRegistry(context.name, context.component_name)}
        </AkTypography>

        <div className="flex flex-col gap-1 border-t border-divider-strong p-3.25">
          <AkTypography tag="p" variant="body2" color="textSecondary">
            <AkMessageTranslate id="notificationModule.newVersion" />
            {': '}
            <AkTypography tag="span" color="textPrimary" fontWeight="bold">
              {context.new_version}
            </AkTypography>
          </AkTypography>

          <AkTypography tag="p" variant="body2" color="textSecondary">
            <AkMessageTranslate id="notificationModule.affects" />
            {': '}
            <AkTypography tag="span" color="textPrimary" fontWeight="bold">
              {`${context.affected_apps_count ?? ''} ${akMT('appOrS')}`}
            </AkTypography>
          </AkTypography>
        </div>
      </div>

      <div className="flex items-center gap-1.75">
        <Link
          to="/dashboard/sbom/component-inventory"
          search={{ component_query: context.component_name }}
          className="self-start"
        >
          <AkButton color="primary">{akMT('notificationModule.viewComponent')}</AkButton>
        </Link>

        {context.registry_url && (
          <a href={context.registry_url} target="_blank" rel="noopener noreferrer">
            <AkButton variant="outlined" color="neutral">
              <AkMessageTranslate id="notificationModule.viewDirectory" />
            </AkButton>
          </a>
        )}
      </div>
    </NotificationMessageLayout>
  );
}
