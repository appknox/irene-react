import { useState } from 'react';

import { ENUMS } from '@irene/enums';
import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkPopover, AkPopoverContent, AkPopoverTrigger } from '@irene/ui/ak-popover';
import { AkRadio, AkRadioGroup } from '@irene/ui/ak-radio';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';
import type { ApiSkMonitoringStatusFilter } from '@irene/api/services/storeknox';

type MonitoringFilter = ApiSkMonitoringStatusFilter | -1;

interface MonitoringStatusHeaderProps {
  selected: MonitoringFilter;
  onStatusChange: (status: MonitoringFilter) => void;
}

/**
 * The monitoring-status column's heading, with a filter by state behind its
 * icon and a way to clear it once one is set.
 *
 * @param props.selected - The state the list is filtered to, `-1` for every state.
 * @param props.onStatusChange - Called with the state chosen; `-1` clears the filter.
 */
export function MonitoringStatusHeader({
  selected,
  onStatusChange,
}: Readonly<MonitoringStatusHeaderProps>) {
  const [open, setOpen] = useState(false);
  const filterApplied = selected > -1;

  const options: Array<{ label: string; value: MonitoringFilter }> = [
    { label: akMT('all'), value: -1 },
    {
      label: akMT('storeknox.needsAction'),
      value: ENUMS.SK_APP_MONITORING_STATUS_FILTER.ACTION_NEEDED,
    },
    {
      label: akMT('storeknox.beingInitialized'),
      value: ENUMS.SK_APP_MONITORING_STATUS_FILTER.INITIALIZING,
    },
    { label: akMT('disabled'), value: ENUMS.SK_APP_MONITORING_STATUS_FILTER.DISABLED },
    {
      label: akMT('storeknox.noActionNeeded'),
      value: ENUMS.SK_APP_MONITORING_STATUS_FILTER.NO_ACTION_NEEDED,
    },
    {
      label: akMT('storeknox.decommissioned'),
      value: ENUMS.SK_APP_MONITORING_STATUS_FILTER.DECOMMISSIONED,
    },
  ];

  const choose = (value: MonitoringFilter) => {
    setOpen(false);
    onStatusChange(value);
  };

  return (
    <div className="flex items-center gap-1">
      <AkPopover open={open} onOpenChange={setOpen}>
        <AkPopoverTrigger asChild>
          <AkIconButton size="small" aria-label={akMT('storeknox.monitoringStatus')}>
            <AkIcon
              name="material-symbols:filter-list"
              className={cn(filterApplied && 'text-primary')}
            />
          </AkIconButton>
        </AkPopoverTrigger>

        <AkPopoverContent side="bottom" className="w-50 p-0" data-test-sk-monitoring-filter>
          <AkTypography variant="subtitle2" className="bg-background-subtle px-4 py-2">
            <AkMessageTranslate id="status" />
          </AkTypography>

          <AkRadioGroup
            aria-label={akMT('status')}
            value={String(selected)}
            onValueChange={(value) => {
              const option = options.find((candidate) => String(candidate.value) === value);

              if (option) {
                choose(option.value);
              }
            }}
          >
            {options.map((option) => (
              <div key={option.value}>
                <label
                  className="
                    flex cursor-pointer items-center gap-2 py-2 pl-4
                    hover:bg-background-subtle
                  "
                >
                  <AkRadio value={String(option.value)} />

                  <AkTypography tag="span">{option.label}</AkTypography>
                </label>

                <AkDivider color="light" />
              </div>
            ))}
          </AkRadioGroup>

          {filterApplied && (
            <AkButton
              variant="text"
              color="primary"
              className="px-4 py-2 underline"
              onClick={() => choose(-1)}
            >
              <AkMessageTranslate id="clearFilter" />
            </AkButton>
          )}
        </AkPopoverContent>
      </AkPopover>

      <AkTypography tag="span" variant="subtitle2">
        <AkMessageTranslate id="storeknox.monitoringStatus" />
      </AkTypography>
    </div>
  );
}
