import { useQuery } from '@tanstack/react-query';

import { ENUMS } from '@irene/enums';
import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiSkApp } from '@irene/api/services/storeknox';

import { skOrganizationUserOptions } from '@/features/storeknox/queries/inventory';
import { useOrganization } from '@/hooks/use-organization';

/**
 * Who asked for an app: the member's email for a manual search, or "System"
 * for one auto-discovery found. The time and source are behind the info icon.
 *
 * @param props.app - Absent while its row loads.
 */
export function RequestedByCell({ app }: Readonly<{ app?: ApiSkApp }>) {
  const { selectedId } = useOrganization();
  const isManual = app?.app_source === ENUMS.SK_DISCOVERY.MANUAL;
  const addedBy = app?.added_by;

  const { data: requester } = useQuery({
    ...skOrganizationUserOptions(selectedId(), addedBy ?? ''),
    enabled: isManual && Boolean(addedBy),
  });

  if (!app) {
    return <AkSkeleton width="120px" height="16px" />;
  }

  return (
    <div className="flex items-center gap-1">
      <AkTypography noWrap data-test-sk-requested-by>
        {isManual ? requester?.email : akMT('system')}
      </AkTypography>

      <AkTooltip
        color="light"
        arrow
        side="bottom"
        title={
          <div className="p-2">
            <div className="mb-1 flex flex-col gap-1">
              <AkTypography color="inherit" fontWeight="medium">
                <AkMessageTranslate id="requestedOn" />
              </AkTypography>

              <AkTypography color="inherit">
                {formatDateTime(app.added_on, 'longDateTime')}
              </AkTypography>
            </div>

            <AkDivider color="dark" className="my-2" />

            <div className="mt-1 flex flex-col gap-1">
              <AkTypography color="inherit" fontWeight="medium">
                <AkMessageTranslate id="type" />
              </AkTypography>

              <AkTypography color="inherit">
                {isManual ? akMT('storeknox.manualDiscovery') : akMT('storeknox.autoDiscovery')}
              </AkTypography>
            </div>
          </div>
        }
      >
        <span className="inline-flex" aria-label={akMT('requestedOn')} tabIndex={0}>
          <AkIcon name="material-symbols:info" className="size-4 text-foreground-muted" />
        </span>
      </AkTooltip>
    </div>
  );
}
