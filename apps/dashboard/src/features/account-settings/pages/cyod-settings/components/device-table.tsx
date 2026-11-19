import { useQuery } from '@tanstack/react-query';
import { type ReactNode } from 'react';

import { getApiErrorStatus } from '@irene/api/utils/errors';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkChip } from '@irene/ui/ak-chip';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkSpinner } from '@irene/ui/ak-spinner';
import { AkTable } from '@irene/ui/ak-table';
import { createAkTableColumns } from '@irene/ui/ak-table/helpers';
import { AkTypography } from '@irene/ui/ak-typography';
import ProjectListEmpty from '@irene/ui/svgs/project-list-empty.svg?react';
import type { ApiCyodRegisteredDevice } from '@irene/api/services/organization';

import { registeredDevicesOptions } from '@/features/account-settings/queries/cyod';
import { useOrganization } from '@/hooks/use-organization';

/** The statuses that mean the organization has no device farm of its own, rather than a failure. */
const NOT_CONFIGURED_STATUSES = new Set<number>([
  HTTP_STATUS_CODES.BAD_REQUEST,
  HTTP_STATUS_CODES.FORBIDDEN,
]);

const deviceColumn = createAkTableColumns<ApiCyodRegisteredDevice>();

const DEVICE_COLUMNS = deviceColumn.columns([
  deviceColumn.display({
    id: 'name',
    header: () => akMT('cyod.deviceTable.name'),
    meta: { width: '340px' },
    cell: ({ row }) => {
      /* The device farm fills different fields for different devices, so the first one present names it. */
      const name = row.original.name || row.original.model || row.original.serial_number;

      return (
        <AkTypography tag="span" title={name} noWrap>
          {name}
        </AkTypography>
      );
    },
  }),

  deviceColumn.accessor('created_on', {
    header: () => akMT('cyod.deviceTable.registeredOn'),
    meta: { width: '130px' },
    cell: ({ getValue }) => (
      <AkTypography tag="span" noWrap>
        {formatDateTime(getValue(), 'longDate') || '-'}
      </AkTypography>
    ),
  }),

  deviceColumn.accessor('is_connected', {
    header: () => akMT('cyod.deviceTable.status'),
    meta: { width: '120px', align: 'center' },
    cell: ({ getValue }) => {
      const isConnected = getValue();

      const label = isConnected
        ? akMT('cyod.deviceRegistration.online')
        : akMT('cyod.deviceRegistration.offline');

      return (
        <AkChip
          variant="semi-filled"
          size="small"
          fontWeight="medium"
          color={isConnected ? 'success' : 'secondary'}
          label={label}
          data-test-cyod-device-status
        />
      );
    },
  }),
]);

interface DeviceTableProps {
  heading: string;
  subheading: string;
  emptyHint: ReactNode;
}

/**
 * The account's connected CYOD devices, with a control to ask again.
 *
 * Only connected devices are listed: the account view is about the device
 * this account can scan on now, and an offline one is nothing to act on.
 * irene shares this table with the organization's settings, which list every
 * device; that page is not built yet, so this one stays here until it is.
 *
 * @param props.heading - What the table holds.
 * @param props.subheading - The line under the heading.
 * @param props.emptyHint - What to do when there is no device yet.
 */
export function DeviceTable({ heading, subheading, emptyHint }: Readonly<DeviceTableProps>) {
  const organizationId = useOrganization().selectedId();
  const devices = useQuery(registeredDevicesOptions(organizationId));
  const isNotConfigured = NOT_CONFIGURED_STATUSES.has(getApiErrorStatus(devices.error) ?? 0);
  const connectedDevices = (devices.data ?? []).filter((device) => device.is_connected);

  return (
    <div className="flex w-full flex-col gap-3.5" data-test-cyod-device-table>
      <div className="flex items-start justify-between gap-3.5">
        <div className="flex flex-col gap-1.75">
          <AkTypography variant="subtitle1">{heading}</AkTypography>

          <AkTypography color="textSecondary">{subheading}</AkTypography>
        </div>

        <AkIconButton
          size="small"
          variant="outlined"
          aria-label={akMT('refresh')}
          onClick={() => devices.refetch()}
          disabled={devices.isFetching}
          data-test-cyod-device-refresh
        >
          <AkIcon name="material-symbols:refresh" />
        </AkIconButton>
      </div>

      {devices.isFetching && (
        <div
          className="
            flex items-center justify-center gap-1.75 rounded-sm border border-divider-strong p-6
          "
          data-test-cyod-device-loading
        >
          <AkSpinner color="primary" />

          <AkTypography variant="body2" color="textSecondary">
            {akMT('loading')}
          </AkTypography>
        </div>
      )}

      {!devices.isFetching && isNotConfigured && (
        <div
          className="
            flex items-center gap-2 rounded-sm border border-divider-strong bg-background-subtle p-4
            text-foreground-muted
          "
          data-test-cyod-device-not-configured
        >
          <AkIcon name="material-symbols:info" className="shrink-0" />

          <AkTypography variant="body2" color="inherit">
            {akMT('cyod.deviceRegistration.notConfigured')}
          </AkTypography>
        </div>
      )}

      {!devices.isFetching && !isNotConfigured && connectedDevices.length > 0 && (
        <AkTable
          columns={DEVICE_COLUMNS}
          data={connectedDevices}
          dense
          borderColor="dark"
          caption={heading}
          getRowId={(device) => device.serial_number}
        />
      )}

      {!devices.isFetching && !isNotConfigured && connectedDevices.length === 0 && (
        <div
          className="
            flex flex-col items-center gap-3.5 rounded-sm border border-divider-strong px-5.25
            py-9.75
          "
          data-test-cyod-device-empty
        >
          <ProjectListEmpty width="155px" height="63px" aria-hidden="true" />

          <div className="flex flex-col items-center gap-0.75">
            <AkTypography tag="h4" variant="subtitle1">
              {akMT('cyod.deviceTable.emptyTitle')}
            </AkTypography>

            <AkTypography color="textSecondary" align="center" className="max-w-86.25">
              {emptyHint}
            </AkTypography>
          </div>
        </div>
      )}
    </div>
  );
}
