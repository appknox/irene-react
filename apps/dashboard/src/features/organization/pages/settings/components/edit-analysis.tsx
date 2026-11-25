import { useMutation, useQueryClient } from '@tanstack/react-query';

import { OrganizationService } from '@irene/api/services/organization';
import { organizationStore } from '@irene/api/stores/organization';
import { getApiErrorMessage } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkLabel } from '@irene/ui/ak-label';
import { AkSpinner } from '@irene/ui/ak-spinner';
import { AkToggle } from '@irene/ui/ak-toggle';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { useOrganization } from '@/hooks/use-organization';
import { organizationKeys } from '@/queries/organization';

import { SettingsPanel } from './settings-panel';

/**
 * Whether members may ask for an analysis to be overridden.
 *
 * The switch takes effect as it is moved and is put back where the request is
 * refused, rather than leaving the screen claiming something that is not true.
 */
export function EditAnalysisPanel() {
  const queryClient = useQueryClient();
  const { selected, features } = useOrganization();

  const isEnabled = Boolean(features().member_override_request);

  const setFeature = useMutation({
    mutationFn: (enabled: boolean) =>
      OrganizationService.setMemberOverrideRequestFeature(Number(selected?.id), enabled),

    onSuccess: async (_answer, enabled) => {
      /* Held in the store the screens read entitlements from, so it is written there too. */
      organizationStore.getState().setFeature('member_override_request', enabled);

      akNotify.success(akMT('allowEditAnalysisForMembersChanged'));

      await queryClient.invalidateQueries({ queryKey: organizationKeys.list() });
    },

    onError: (error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    },
  });

  return (
    <SettingsPanel title={akMT('editAnalysis')} testAttribute="org-edit-analysis">
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col gap-1">
          <AkLabel htmlFor="enable-edit-analysis-for-members" className="font-medium">
            {akMT('allowEditAnalysisForMembers')}
          </AkLabel>

          <AkTypography
            variant="body2"
            color="textSecondary"
            data-test-org-edit-analysis-explanation
          >
            {akMT('editAnalysisForMembersDescription')}
          </AkTypography>
        </div>

        <div className="flex items-center gap-1">
          {setFeature.isPending && (
            <AkSpinner className="size-3.5 text-primary" data-test-org-edit-analysis-loader />
          )}

          <AkToggle
            id="enable-edit-analysis-for-members"
            size="small"
            checked={isEnabled}
            disabled={setFeature.isPending}
            onCheckedChange={(checked) => setFeature.mutate(checked)}
            data-test-org-edit-analysis-toggle
          />
        </div>
      </div>
    </SettingsPanel>
  );
}
