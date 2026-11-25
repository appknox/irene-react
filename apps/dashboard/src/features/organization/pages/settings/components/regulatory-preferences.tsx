import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { OrganizationService, type ApiReportPreference } from '@irene/api/services/organization';
import { getApiErrorMessage } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkCheckbox } from '@irene/ui/ak-checkbox';
import { AkLabel } from '@irene/ui/ak-label';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkTooltip } from '@irene/ui/ak-tooltip';
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

/** The panel's own shape, held while the preferences are read. */
function RegulatoryPreferencesSkeleton() {
  return (
    <div className="flex flex-col gap-2" data-test-org-regulatory-loading>
      <AkSkeleton className="h-5 w-43.75" />

      <AkSkeleton className="h-3.5 w-75" />

      <AkSkeleton className="h-3 w-100" />

      <div className="mt-5 flex flex-col gap-1">
        {REGULATIONS.map((regulation) => (
          <div key={regulation.field} className="flex items-center gap-1">
            <AkSkeleton className="m-1 size-4.5" />

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
      testAttribute="org-regulatory"
    >
      <div className="mt-2 flex flex-col gap-1">
        {REGULATIONS.map((regulation) => {
          const isChanging =
            setRegulation.isPending && setRegulation.variables?.field === regulation.field;

          return (
            <div
              key={regulation.field}
              className="flex items-center gap-1"
              data-test-org-regulatory-preference={regulation.field}
            >
              <AkTooltip arrow title={regulation.title()} disabled={isChanging}>
                <span className="flex items-center gap-1">
                  <AkCheckbox
                    id={regulation.field}
                    checked={reportPreference[regulation.field]}
                    disabled={isChanging}
                    onCheckedChange={(checked) =>
                      setRegulation.mutate({ field: regulation.field, isShown: checked === true })
                    }
                    data-test-org-regulatory-checkbox
                  />

                  <AkLabel htmlFor={regulation.field}>{regulation.label()}</AkLabel>
                </span>
              </AkTooltip>
            </div>
          );
        })}
      </div>
    </SettingsPanel>
  );
}
