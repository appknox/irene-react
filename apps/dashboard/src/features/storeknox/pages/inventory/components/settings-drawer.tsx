import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import {
  StoreknoxService,
  type ApiSkOrganizationSettingsRequest,
} from '@irene/api/services/storeknox';

import { unlessRateLimited } from '@irene/api/utils/errors';
import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkDrawerContent, AkDrawerHeader } from '@irene/ui/ak-drawer';
import { AkLink } from '@irene/ui/ak-link';
import { AkToggle } from '@irene/ui/ak-toggle';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { skErrorMessage } from '@/features/storeknox/utils/error-message';
import { organizationKeys, storeknoxOrganizationOptions } from '@/queries/organization';

/**
 * The owner's inventory settings drawer: auto-adding Appknox projects and auto-discovering store
 * apps. Each toggle saves on flip, and the saved organization replaces the cached one.
 */
export function SettingsDrawer() {
  const queryClient = useQueryClient();
  const { data: organization } = useQuery(storeknoxOrganizationOptions());

  const toggleSetting = useMutation({
    mutationFn: (settings: ApiSkOrganizationSettingsRequest) =>
      StoreknoxService.updateOrganizationSettings(organization?.id ?? '', settings),
    onSuccess: (saved) => {
      queryClient.setQueryData(organizationKeys.storeknox(), saved);
      akNotify.success(akMT('storeknox.statusToggleSuccessMessage'));
    },
    onError: unlessRateLimited((error) => akNotify.error(skErrorMessage(error))),
  });

  /* Both toggles wait for the organization, whose id the save goes to, and for a save in flight, so two flips cannot race. */
  const isLocked = !organization || toggleSetting.isPending;

  return (
    <AkDrawerContent className="w-160 max-w-full" data-test-sk-settings-drawer>
      <AkDrawerHeader title={akMT('storeknox.inventorySettings')} closeLabel={akMT('close')} />

      <div className="flex w-full items-center justify-between gap-4 px-6 py-8">
        <div className="flex max-w-112.5 flex-col gap-1">
          <AkTypography fontWeight="bold" id="sk-setting-add-projects">
            <AkMessageTranslate id="storeknox.addAppknoxProjectsByDefault" />
          </AkTypography>

          <AkTypography variant="body2" color="neutral">
            <AkMessageTranslate id="storeknox.addVAPTPrjsByDefaultToggleDesc1" />{' '}
            <AkLink color="primary" underline="always" asChild>
              <Link to="/dashboard/projects" target="_blank" rel="noopener noreferrer">
                <AkMessageTranslate id="vapt" />
              </Link>
            </AkLink>{' '}
            <AkMessageTranslate id="storeknox.addVAPTPrjsByDefaultToggleDesc2" />
          </AkTypography>
        </div>

        <AkToggle
          size="small"
          aria-labelledby="sk-setting-add-projects"
          disabled={isLocked}
          checked={Boolean(organization?.add_appknox_project_to_inventory_by_default)}
          onCheckedChange={(checked) =>
            toggleSetting.mutate({ add_appknox_project_to_inventory_by_default: checked })
          }
        />
      </div>

      <AkDivider color="dark" />

      <div className="flex w-full items-center justify-between gap-4 px-6 py-8">
        <div className="flex max-w-112.5 flex-col gap-1">
          <AkTypography fontWeight="bold" id="sk-setting-auto-discovery">
            <AkMessageTranslate id="storeknox.autoDiscovery" />
          </AkTypography>

          <AkTypography variant="body2" color="neutral">
            <AkMessageTranslate id="storeknox.autoDiscoveryToggleDesc" />
          </AkTypography>
        </div>

        <AkToggle
          size="small"
          aria-labelledby="sk-setting-auto-discovery"
          disabled={isLocked}
          checked={Boolean(organization?.auto_discovery_enabled)}
          onCheckedChange={(checked) => toggleSetting.mutate({ auto_discovery_enabled: checked })}
        />
      </div>

      <AkDivider color="dark" />
    </AkDrawerContent>
  );
}
