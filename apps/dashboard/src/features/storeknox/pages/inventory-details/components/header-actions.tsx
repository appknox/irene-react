import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkSpinner } from '@irene/ui/ak-spinner';
import { AkToggle } from '@irene/ui/ak-toggle';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiSkInventoryApp } from '@irene/api/services/storeknox';

import {
  canUnarchive,
  isArchived,
  isDecommissioned,
  isReadOnly,
} from '@/features/storeknox/utils/sk-app';

import { SkCheckChip } from '@/features/storeknox/components/sk-check-chip';
import { useActiveDetailsSection } from '@/features/storeknox/hooks/use-active-details-section';
import { useOrganization } from '@/hooks/use-organization';

interface HeaderActionsProps {
  app: ApiSkInventoryApp;
  monitoringChecked: boolean;
  isToggling: boolean;
  onMonitoringToggle: (checked: boolean) => void;
  onArchiveClick: () => void;
}

/**
 * The details header's controls: a section tag or the monitoring switch, plus the archive button
 * for owners and admins, hidden on decommissioned apps since archiving would overwrite that state.
 */
export function HeaderActions({
  app,
  monitoringChecked,
  isToggling,
  onMonitoringToggle,
  onArchiveClick,
}: Readonly<HeaderActionsProps>) {
  const { isOwner, isAdmin } = useOrganization();
  const section = useActiveDetailsSection(app);

  const isOwnerOrAdmin = isOwner() || isAdmin();
  const disableArchiving = isArchived(app) && !canUnarchive(app);
  const showArchiveButton = isOwnerOrAdmin && !isDecommissioned(app);
  const showDivider = !isReadOnly(app) || Boolean(section);

  return (
    <div className="flex items-center justify-end gap-2">
      {section && (
        <SkCheckChip
          label={section.label}
          disabled
          hideRightIcon
          needsAction={section.needsAction}
          featureInProgress={section.featureInProgress}
          readOnly={isReadOnly(app)}
          className="border-none"
          data-test-sk-details-page-tag
        />
      )}

      {!section && !isReadOnly(app) && (
        <>
          <div className="flex items-center gap-2">
            {isToggling && <AkSpinner className="size-3.5" />}

            <AkTooltip
              disabled={isOwnerOrAdmin}
              arrow
              side="top"
              title={akMT('storeknox.cannotPerformStatusToggleText')}
            >
              <span className="inline-flex">
                <AkToggle
                  size="small"
                  aria-label={akMT('storeknox.monitoringAction')}
                  checked={monitoringChecked}
                  disabled={!isOwnerOrAdmin || isToggling}
                  onCheckedChange={onMonitoringToggle}
                />
              </span>
            </AkTooltip>
          </div>

          <AkTypography color="neutral">
            <AkMessageTranslate id="storeknox.monitoringAction" />
          </AkTypography>
        </>
      )}

      {showArchiveButton && (
        <>
          {showDivider && <AkDivider direction="vertical" color="dark" className="mx-2 h-8" />}

          <AkTooltip
            disabled={!disableArchiving}
            arrow
            side="left"
            title={akMT('storeknox.actionDisabledDueToLockPeriod')}
          >
            <span className="inline-flex">
              <AkIconButton
                variant="outlined"
                aria-label={
                  isArchived(app) ? akMT('storeknox.unarchive') : akMT('storeknox.archive')
                }
                disabled={disableArchiving}
                onClick={onArchiveClick}
              >
                <AkIcon
                  name={isArchived(app) ? 'material-symbols:unarchive' : 'material-symbols:archive'}
                />
              </AkIconButton>
            </span>
          </AkTooltip>
        </>
      )}
    </div>
  );
}
