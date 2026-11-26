import dayjs from 'dayjs';

import { akMT } from '@irene/translations/intl';
import { AkChip } from '@irene/ui/ak-chip';
import { createAkTableColumns } from '@irene/ui/ak-table/helpers';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiOrganizationRegisteredDevice } from '@irene/api/services/organization';

const column = createAkTableColumns<ApiOrganizationRegisteredDevice>();

/* irene's own widths, as shares of the table: 340 / 130 / 120 of its 590px. */
const COLUMN_WIDTHS = { name: '57.6%', registeredOn: '22%', status: '20.4%' };

/* The pattern a registration date is written in, rather than one of the locale's own. */
const REGISTERED_ON_FORMAT = 'D MMMM YYYY';

/** What a device is called: its name, else its model, else its serial number. */
function deviceName(device: ApiOrganizationRegisteredDevice) {
  return device.name ?? device.model ?? device.serial_number;
}

/**
 * The columns of the registered device table, in irene's order.
 *
 * @returns The columns.
 */
export const buildRegisteredDeviceColumns = () =>
  column.columns([
    column.display({
      id: 'name',
      header: () => akMT('cyod.deviceTable.name'),
      meta: { width: COLUMN_WIDTHS.name },

      cell: ({ row }) => (
        <AkTypography noWrap title={deviceName(row.original)} data-test-org-device-name>
          {deviceName(row.original)}
        </AkTypography>
      ),
    }),

    column.accessor('created_on', {
      header: () => akMT('cyod.deviceTable.registeredOn'),
      meta: { width: COLUMN_WIDTHS.registeredOn },

      cell: ({ getValue }) => (
        <AkTypography noWrap data-test-org-device-registered-on>
          {getValue() === null ? '-' : dayjs(getValue()).format(REGISTERED_ON_FORMAT)}
        </AkTypography>
      ),
    }),

    column.accessor('is_connected', {
      header: () => akMT('cyod.deviceTable.status'),
      meta: { width: COLUMN_WIDTHS.status, align: 'center' },

      cell: ({ getValue }) => (
        <AkChip
          variant="semi-filled"
          size="small"
          fontWeight="medium"
          color={getValue() ? 'success' : 'secondary'}
          label={
            getValue()
              ? akMT('cyod.deviceRegistration.online')
              : akMT('cyod.deviceRegistration.offline')
          }
          data-test-org-device-status
        />
      ),
    }),
  ]);
