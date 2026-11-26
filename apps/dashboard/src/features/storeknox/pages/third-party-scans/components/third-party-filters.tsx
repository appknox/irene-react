import {
  AkSelect,
  AkSelectContent,
  AkSelectItem,
  AkSelectTrigger,
  AkSelectValue,
} from '@irene/ui/ak-select';

import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiSkThirdPartyConfig, ApiSkThirdPartyStore } from '@irene/api/services/storeknox';

import {
  availableStores,
  regionLabel,
  regionsByStore,
} from '@/features/storeknox/utils/third-party';

interface ThirdPartyFiltersProps {
  config: ApiSkThirdPartyConfig;
  store: ApiSkThirdPartyStore;
  region: string;

  /** The risk status the list is filtered to, `-1` for every status. */
  riskStatus: number;
  onStoreChange: (store: ApiSkThirdPartyStore) => void;
  onRegionChange: (region: string) => void;
  onRiskStatusChange: (riskStatus: number) => void;
}

interface FilterSelectProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

/* A filter as a select whose trigger names what it filters: "Store" beside the choice made. */
function _FilterSelect({ label, value, options, onChange }: Readonly<FilterSelectProps>) {
  return (
    <AkSelect value={value} onValueChange={onChange}>
      <AkSelectTrigger aria-label={label} className="min-w-35 gap-1 pl-2">
        <AkIcon name="material-symbols:filter-list" className="size-4.5 text-foreground-muted" />

        <AkTypography tag="span" color="textSecondary" className="mr-0.5">
          {label}:
        </AkTypography>

        <AkSelectValue />
      </AkSelectTrigger>

      <AkSelectContent position="popper" side="bottom" align="start">
        {options.map((option) => (
          <AkSelectItem key={option.value} value={option.value}>
            {option.label}
          </AkSelectItem>
        ))}
      </AkSelectContent>
    </AkSelect>
  );
}

/**
 * The selects above the list: store (only when both stores have regions), region (when the store has
 * more than one, else a chip naming the only one) and risk status.
 *
 * @param props.config - The organization's scan config, which says what can be chosen.
 * @param props.store - The store the list shows.
 * @param props.region - The region the list shows.
 * @param props.riskStatus - The risk status filter, `-1` for every status.
 */
export function ThirdPartyFilters({
  config,
  store,
  region,
  riskStatus,
  onStoreChange,
  onRegionChange,
  onRiskStatusChange,
}: Readonly<ThirdPartyFiltersProps>) {
  const stores = availableStores(config);
  const regions = regionsByStore(config)[store];

  const storeNames = {
    appstore: akMT('storeknox.appStore'),
    playstore: akMT('storeknox.playStore'),
  };

  const riskOptions = [
    { value: -1, label: akMT('all') },
    {
      value: ENUMS.SK_THIRD_PARTY_APP_RISK_STATUS.MINIMAL,
      label: akMT('storeknox.riskStatus.minimal'),
    },
    {
      value: ENUMS.SK_THIRD_PARTY_APP_RISK_STATUS.MEDIUM,
      label: akMT('storeknox.riskStatus.medium'),
    },
    { value: ENUMS.SK_THIRD_PARTY_APP_RISK_STATUS.HIGH, label: akMT('storeknox.riskStatus.high') },
  ];

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <div className="flex flex-wrap items-center gap-3">
        {stores.length > 1 && (
          <_FilterSelect
            label={akMT('storeknox.store')}
            value={store}
            options={stores.map((option) => ({ value: option, label: storeNames[option] }))}
            onChange={(value) => {
              const chosen = stores.find((option) => option === value);

              if (chosen) {
                onStoreChange(chosen);
              }
            }}
          />
        )}

        {regions.length > 1 && (
          <_FilterSelect
            label={akMT('storeknox.region')}
            value={region}
            options={regions.map((code) => ({ value: code, label: regionLabel(code) }))}
            onChange={onRegionChange}
          />
        )}

        <_FilterSelect
          label={akMT('riskStatus')}
          value={String(riskStatus)}
          options={riskOptions.map((option) => ({
            value: String(option.value),
            label: option.label,
          }))}
          onChange={(value) => {
            const chosen = riskOptions.find((option) => String(option.value) === value);

            if (chosen) {
              onRiskStatusChange(chosen.value);
            }
          }}
        />
      </div>

      {regions.length === 1 && (
        <div className="flex items-center gap-1" data-test-sk-third-party-region-chip>
          <AkIcon name="material-symbols:language" className="size-4.5 text-foreground-muted" />

          <AkTypography variant="body2" color="textSecondary">
            {akMT('storeknox.region')} - {regionLabel(region)}
          </AkTypography>
        </div>
      )}
    </div>
  );
}
