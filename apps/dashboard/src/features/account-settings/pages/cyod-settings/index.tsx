import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkDrawer, AkDrawerTrigger } from '@irene/ui/ak-drawer';
import { AkTypography } from '@irene/ui/ak-typography';
import ToggleAutomatedDast from '@irene/ui/svgs/toggle-automated-dast.svg?react';

import { useOrganization } from '@/hooks/use-organization';

import { DeviceTable } from './components/device-table';
import { RegisterDeviceDrawer } from './components/register-device-drawer';

/**
 * The CYOD settings tab of account settings: the device this account can scan
 * on, and how to register one with Mercer.
 *
 * Nothing renders unless the organization has CYOD. irene gates the tab on the
 * same feature but leaves this route reachable by URL, so the page checks
 * again. Where CYOD is on but the owner has turned registration off, the page
 * says so, and tells an owner where to turn it on.
 */
export function CyodSettingsPage() {
  const { features, selected, me } = useOrganization();

  if (!features().cyod) {
    return null;
  }

  return (
    <section className="flex w-full flex-col gap-3.5 p-5.25" data-test-cyod-settings>
      <AkTypography variant="h5">{akMT('cyod.registration.title')}</AkTypography>

      {selected?.cyod_registration_enabled ? (
        <>
          <div className="flex w-full items-start justify-between gap-3.5">
            <div className="flex flex-col gap-1.75">
              <AkTypography variant="subtitle1">
                {akMT('cyod.settings.deviceRegistration')}
              </AkTypography>

              <AkTypography color="textSecondary">
                {akMT('cyod.settings.deviceRegistrationDesc')}
              </AkTypography>
            </div>

            <AkDrawer>
              <AkDrawerTrigger asChild>
                <AkButton className="shrink-0">{akMT('cyod.settings.registerADevice')}</AkButton>
              </AkDrawerTrigger>

              <RegisterDeviceDrawer />
            </AkDrawer>
          </div>

          <AkDivider color="dark" />

          <DeviceTable
            heading={akMT('cyod.settings.connectedDevice')}
            subheading={akMT('cyod.settings.connectedDeviceDesc')}
            emptyHint={akMT('cyod.settings.emptyHint')}
          />
        </>
      ) : (
        <div
          className="
            flex w-full flex-col items-center gap-3.5 rounded-sm border border-divider-strong
            px-5.25 py-9.75
          "
          data-test-cyod-settings-disabled
        >
          <ToggleAutomatedDast aria-hidden="true" />

          <div className="flex flex-col items-center gap-0.75">
            <AkTypography tag="h4" variant="subtitle1">
              {akMT('cyod.settings.turnOnTitle')}
            </AkTypography>

            <AkTypography color="textSecondary" align="center" className="max-w-86.25">
              {me?.is_owner
                ? akMT('cyod.settings.turnOnDescOwner')
                : akMT('cyod.settings.turnOnDesc')}
            </AkTypography>
          </div>
        </div>
      )}
    </section>
  );
}
