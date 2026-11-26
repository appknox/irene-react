import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  OrganizationService,
  type ApiOrganizationRegisteredDevice,
} from '@irene/api/services/organization';

import { getApiErrorMessage, getApiErrorStatus } from '@irene/api/utils/errors';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkLink } from '@irene/ui/ak-link';
import { AkTable } from '@irene/ui/ak-table';
import { AkToggle } from '@irene/ui/ak-toggle';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';
import ProjectListEmpty from '@irene/ui/svgs/project-list-empty.svg?react';

import { useOrganization } from '@/hooks/use-organization';
import { organizationKeys, organizationRegisteredDevicesOptions } from '@/queries/organization';

import { buildRegisteredDeviceColumns } from './device-columns';
import { TableSkeleton } from './table-skeleton';
import { SettingsPanel } from './settings-panel';

/** Where a member registers a device of their own, which the hint points at. */
const CYOD_SETTINGS_ADDRESS = '/dashboard/settings/cyod-settings';

/** Nothing registered yet, which irene draws in place of the table. */
function NoDevices() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-1.75 px-5.25 py-7"
      data-test-org-device-registration-empty
    >
      <ProjectListEmpty aria-hidden="true" width="155" height="63" />

      <AkTypography tag="h5" fontWeight="medium" data-test-org-device-registration-empty-title>
        {akMT('cyod.deviceTable.emptyTitle')}
      </AkTypography>

      <AkTypography variant="body2" className="text-center">
        {akMT('cyod.registration.emptyHint')}
      </AkTypography>

      <AkLink
        href={CYOD_SETTINGS_ADDRESS}
        color="primary"
        className="mt-1.75 flex items-center gap-1 text-md font-semibold"
        data-test-org-device-registration-settings-link
      >
        {akMT('cyod.registration.goToCyodSettings')}

        <AkIcon name="material-symbols:open-in-new" className="size-4" aria-hidden />
      </AkLink>
    </div>
  );
}

/** The devices themselves, or what stands in for them while none can be shown. */
function RegisteredDevices({ organizationId }: Readonly<{ organizationId: number | undefined }>) {
  const devices = useQuery(organizationRegisteredDevicesOptions(organizationId));

  if (devices.isPending) {
    return (
      <div data-test-org-device-registration-loading>
        <TableSkeleton widths={['w-1/2', 'w-1/5', 'w-1/6']} rows={3} />
      </div>
    );
  }

  /*
    The endpoint refuses with 400 where the organization allows registration but has no device
    farm behind it. That is not a failure to report: it is something only an Appknox
    administrator can put right, so it is said plainly and apart from having none yet.
  */
  if (devices.isError) {
    const isUnconfigured = getApiErrorStatus(devices.error) === HTTP_STATUS_CODES.BAD_REQUEST;

    return (
      <div
        className="flex items-center gap-1.75 py-5.25"
        data-test-org-device-registration-not-configured
      >
        <AkIcon name="material-symbols:info" className="size-4 text-neutral-500" aria-hidden />

        <AkTypography variant="body2" color="textSecondary">
          {isUnconfigured
            ? akMT('cyod.deviceRegistration.notConfigured')
            : (getApiErrorMessage(devices.error) ?? akMT('pleaseTryAgain'))}
        </AkTypography>
      </div>
    );
  }

  const rows = devices.data?.items ?? [];

  if (rows.length === 0) {
    return <NoDevices />;
  }

  return (
    <AkTable
      dense
      variant="semi-bordered"
      borderColor="dark"
      columns={buildRegisteredDeviceColumns()}
      data={rows}
      caption={akMT('cyod.registration.title')}
      getRowId={(device: ApiOrganizationRegisteredDevice) => String(device.id)}
      data-test-org-device-registration-table
    />
  );
}

/**
 * Whether members may register devices of their own, and the ones they have.
 *
 * The table is drawn only while registration is on, as irene draws it: there is
 * nothing to list where nobody may register anything.
 */
export function DeviceRegistrationPanel() {
  const queryClient = useQueryClient();
  const { selected } = useOrganization();

  const isEnabled = Boolean(selected?.cyod_registration_enabled);

  const setEnabled = useMutation({
    mutationFn: (enabled: boolean) =>
      OrganizationService.setCyodRegistrationEnabled(Number(selected?.id), enabled),

    onSuccess: async () => {
      akNotify.success(akMT('cyod.registration.saved'));

      await queryClient.invalidateQueries({ queryKey: organizationKeys.list() });
    },

    onError: (error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    },
  });

  return (
    <SettingsPanel
      title={akMT('cyod.registration.title')}
      testAttribute="org-device-registration"
      titleAction={
        <AkToggle
          id="cyod-registration"
          size="small"
          checked={isEnabled}
          disabled={setEnabled.isPending}
          onCheckedChange={(checked) => setEnabled.mutate(checked)}
          data-test-org-device-registration-toggle
        />
      }
    >
      <AkTypography
        variant="body2"
        color="textSecondary"
        className="max-w-125"
        data-test-org-device-registration-description
      >
        {`${akMT('cyod.registration.description')} ${akMT('cyod.registration.addDeviceHint')} `}

        <AkLink href={CYOD_SETTINGS_ADDRESS} color="primary" className="text-md">
          {akMT('accountSettings')}
        </AkLink>

        {akMT('cyod.registration.addDeviceHintEnd')}
      </AkTypography>

      {isEnabled && (
        <div className="mt-3.5">
          <RegisteredDevices organizationId={selected?.id} />
        </div>
      )}
    </SettingsPanel>
  );
}
