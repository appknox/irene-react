import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { OrganizationService, type ApiReportPreference } from '@irene/api/services/organization';
import { getApiErrorMessage } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkCheckbox } from '@irene/ui/ak-checkbox';
import { AkLabel } from '@irene/ui/ak-label';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkSpinner } from '@irene/ui/ak-spinner';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { cn } from '@irene/ui/cn';
import { akNotify } from '@irene/ui/notify';

import { useOrganization } from '@/hooks/use-organization';
import { organizationKeys, organizationPreferenceOptions } from '@/queries/organization';

import { SettingsPanel } from './settings-panel';

/** The regulations reports may carry, each with what its initials stand for. */
const REGULATIONS: {
  field: keyof ApiReportPreference;
  label: () => string;
  title: () => string;
}[] = [
  { field: 'show_pcidss', label: () => akMT('pcidss'), title: () => akMT('pcidssExpansion') },
  { field: 'show_hipaa', label: () => akMT('hipaa'), title: () => akMT('hipaaExpansion') },
  { field: 'show_gdpr', label: () => akMT('gdpr'), title: () => akMT('gdprExpansion') },
  { field: 'show_nist', label: () => akMT('nist'), title: () => akMT('nistExpansion') },
  { field: 'show_sama', label: () => akMT('sama'), title: () => akMT('samaExpansion') },
  { field: 'show_dora', label: () => akMT('dora'), title: () => akMT('doraExpansion') },
  { field: 'show_eucra', label: () => akMT('eucra'), title: () => akMT('eucraExpansion') },
  { field: 'show_popia', label: () => akMT('popia'), title: () => akMT('popiaExpansion') },
];

/* irene stands in for five rows while the preferences are read, whatever their number. */
const SKELETON_ROWS = [0, 1, 2, 3, 4];

/** The panel's own shape, held while the preferences are read. */
function RegulatoryPreferencesSkeleton() {
  return (
    <div className="flex flex-col" data-test-org-regulatory-loading>
      <AkSkeleton className="mb-3.5 h-5 w-43.75" />

      <div className="flex flex-col gap-1.75">
        <AkSkeleton className="h-3.5 w-75" />

        <AkSkeleton className="h-3 w-100" />
      </div>

      <div className="mt-8.75 flex flex-col">
        {SKELETON_ROWS.map((row) => (
          <div key={row} className="flex items-center">
            <AkSkeleton className="m-1.75 size-4.5" />

            <AkSkeleton className="h-3.5 w-18.75" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Which regulations an organization's reports carry.
 *
 * The endpoint takes the set whole, so changing one sends the others alongside
 * it. Nothing is drawn where the organization has no preferences to read, as
 * irene draws nothing.
 */
export function RegulatoryPreferencesPanel() {
  const queryClient = useQueryClient();
  const { selected } = useOrganization();

  const preference = useQuery(organizationPreferenceOptions(selected?.id));

  const reportPreference = preference.data?.report_preference;

  const setRegulation = useMutation({
    mutationFn: ({ field, isShown }: { field: keyof ApiReportPreference; isShown: boolean }) =>
      OrganizationService.setOrganizationReportPreference(Number(selected?.id), {
        ...(reportPreference as ApiReportPreference),
        [field]: isShown,
      }),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: organizationKeys.preference(selected?.id),
      });
    },

    onError: (error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    },
  });

  if (preference.isPending) {
    return <RegulatoryPreferencesSkeleton />;
  }

  if (!reportPreference) {
    return null;
  }

  return (
    <SettingsPanel
      title={akMT('regulatoryPreferences')}
      subtitle={akMT('regulatoryPreferencesChooseForAll')}
      description={akMT('regulatoryPreferencesWarning')}
      className="max-w-150"
      testAttribute="org-regulatory"
    >
      {/* 14px under the introduction, and no space between the rows: irene stacks them. */}
      <div className="mt-3.5 flex flex-col">
        {REGULATIONS.map((regulation) => {
          const isChanging =
            setRegulation.isPending && setRegulation.variables?.field === regulation.field;

          return (
            <div
              key={regulation.field}
              className="flex items-center gap-1.75"
              data-test-org-regulatory-preference={regulation.field}
            >
              {/* The name stands beside the box, which is what the tooltip is about. */}
              <AkTooltip arrow side="right" title={regulation.title()} disabled={isChanging}>
                <span className="inline-flex items-center">
                  <AkCheckbox
                    id={regulation.field}
                    checked={reportPreference[regulation.field]}
                    disabled={isChanging}
                    onCheckedChange={(checked) =>
                      setRegulation.mutate({ field: regulation.field, isShown: checked === true })
                    }
                    data-test-org-regulatory-checkbox
                  />

                  {/* Greyed with the box, as irene greys the label of a control it holds. */}
                  <AkLabel
                    htmlFor={regulation.field}
                    className={cn(
                      'text-base leading-normal font-normal',
                      isChanging && 'text-foreground-disabled'
                    )}
                  >
                    {regulation.label()}
                  </AkLabel>
                </span>
              </AkTooltip>

              {isChanging && (
                <AkSpinner className="size-3.5 text-primary" data-test-org-regulatory-loader />
              )}
            </div>
          );
        })}
      </div>
    </SettingsPanel>
  );
}
