import { akMT } from '@irene/translations/intl';
import { createAkTableColumns } from '@irene/ui/ak-table/helpers';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiServiceAccount } from '@irene/api/services/service-account';

import { CreatedBy } from './components/created-by';
import { ServiceAccountActions } from './components/service-account-actions';
import { ServiceAccountExpiry, ServiceAccountName } from './components/service-account-cells';

const column = createAkTableColumns<ApiServiceAccount>();

/*
  irene's own widths, as shares of the table.

  ember-table gives a column without a width its default 100px and leaves the
  table free of the container, so the browser spreads the extra space across
  irene's 100/150/100/100/60 in proportion. These are those proportions, which
  a fixed layout honours the same way: the key is the widest column and the
  action the narrowest.
*/
const COLUMN_WIDTHS = {
  name: '19.6%',
  accessKey: '29.4%',
  expiry: '19.6%',
  createdBy: '19.6%',
  action: '11.8%',
};

/**
 * The columns of the service account list, in irene's order.
 *
 * @param onDelete - Opens the question asked before an account is withdrawn.
 * @returns The columns.
 */
export const buildServiceAccountColumns = (onDelete: (account: ApiServiceAccount) => void) =>
  column.columns([
    column.display({
      id: 'name',
      header: () => akMT('accountName'),
      meta: { width: COLUMN_WIDTHS.name },
      cell: ({ row }) => <ServiceAccountName serviceAccount={row.original} />,
    }),

    column.accessor('access_key_id', {
      header: () => akMT('accessKeyID'),
      meta: { width: COLUMN_WIDTHS.accessKey },
      cell: ({ getValue }) => (
        <AkTypography noWrap title={getValue()} data-test-service-account-key>
          {getValue()}
        </AkTypography>
      ),
    }),

    column.display({
      id: 'expiry',
      header: () => akMT('expiryOn'),
      meta: { width: COLUMN_WIDTHS.expiry },
      cell: ({ row }) => <ServiceAccountExpiry serviceAccount={row.original} />,
    }),

    column.display({
      id: 'created-by',
      header: () => akMT('createdBy'),
      meta: { width: COLUMN_WIDTHS.createdBy },
      cell: ({ row }) => <CreatedBy userId={row.original.created_by_user} />,
    }),

    column.display({
      id: 'action',
      header: () => akMT('action'),
      meta: { width: COLUMN_WIDTHS.action, align: 'center' },
      cell: ({ row }) => (
        <ServiceAccountActions serviceAccount={row.original} onDelete={onDelete} />
      ),
    }),
  ]);
