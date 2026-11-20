import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkPagination, type AkPaginationPage } from '@irene/ui/ak-pagination';
import { AkSpinner } from '@irene/ui/ak-spinner';
import { AkTable } from '@irene/ui/ak-table';
import { createAkTableColumns } from '@irene/ui/ak-table/helpers';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';
import EmptyLoadingList from '@irene/ui/svgs/empty-loading-list.svg?react';
import DetailsTableEmpty from '@irene/ui/svgs/sox-unscanned-details-table-empty.svg?react';
import HistoryTableEmpty from '@irene/ui/svgs/sox-unscanned-history-table-empty.svg?react';
import type { ApiSkAppVersion, ApiSkInventoryApp } from '@irene/api/services/storeknox';

import { useErrorToast } from '@/features/storeknox/hooks/use-error-toast';
import { skAppVersionsOptions } from '@/features/storeknox/queries/inventory';
import { ireneColumnShares } from '@/features/storeknox/utils/column-widths';

import { VersionActionsCell } from './version-actions-cell';
import { CountriesCell, ScanStatusCell } from './version-cells';

const column = createAkTableColumns<ApiSkAppVersion>();

/** The action column's heading, with what the actions do on hover. */
function _ActionsHeader() {
  return (
    <span className="flex items-center justify-center gap-2">
      <AkTypography tag="span" fontWeight="medium">
        <AkMessageTranslate id="action" />
      </AkTypography>

      <AkTooltip arrow side="top" title={akMT('storeknox.actionsInfo')}>
        <span className="inline-flex" aria-label={akMT('storeknox.actionsInfo')} tabIndex={0}>
          <AkIcon name="material-symbols:info" className="size-4" />
        </span>
      </AkTooltip>
    </span>
  );
}

interface VersionsTableProps {
  app: ApiSkInventoryApp;
  isHistory?: boolean;
}

/** An app's paginated store versions, latest or full history (`isHistory`), with scan state and upload actions. */
export function VersionsTable({ app, isHistory = false }: Readonly<VersionsTableProps>) {
  const [page, setPage] = useState<AkPaginationPage>({ limit: 5, offset: 0 });
  const versions = useQuery(skAppVersionsOptions(app.id, isHistory, page));

  useErrorToast(versions.error);

  /* Memoised so reloads keep the same cell functions; new ones remount cells and lose their upload state. */
  const columns = useMemo(() => {
    /* irene's widths, the found-on column only in the history. */
    const widths = isHistory
      ? ireneColumnShares([150, 100, 300, 150, 180])
      : ['', ...ireneColumnShares([150, 300, 150, 180])];

    return column.columns([
      ...(isHistory
        ? [
            column.display({
              id: 'found-on',
              header: () => akMT('storeknox.foundOn'),
              cell: ({ row }) => (
                <AkTypography>{formatDateTime(row.original.created_on, 'mediumDate')}</AkTypography>
              ),
              meta: { width: widths[0] },
            }),
          ]
        : []),
      column.display({
        id: 'store-version',
        header: () => akMT('storeknox.storeVersion'),
        cell: ({ row }) => (
          <AkTooltip arrow side="top" title={row.original.version}>
            <span className="inline-flex max-w-25">
              <AkTypography noWrap>{row.original.version}</AkTypography>
            </span>
          </AkTooltip>
        ),
        meta: { width: widths[1] },
      }),
      column.display({
        id: 'app-status',
        header: () => akMT('storeknox.appStatus'),
        cell: ({ row }) => <ScanStatusCell version={row.original} />,
        meta: { width: widths[2], align: 'center' },
      }),
      column.display({
        id: 'located-in',
        header: () => akMT('storeknox.locatedIn'),
        cell: ({ row }) => <CountriesCell version={row.original} />,
        meta: { width: widths[3], align: 'center' },
      }),
      column.display({
        id: 'action',
        header: () => <_ActionsHeader />,
        cell: ({ row }) => <VersionActionsCell version={row.original} app={app} />,
        meta: { width: widths[4], align: 'center' },
      }),
    ]);
  }, [app, isHistory]);

  if (versions.isPending) {
    return (
      <div
        className="flex flex-col items-center justify-center bg-background py-12"
        data-test-sk-versions-loading
      >
        <EmptyLoadingList aria-hidden="true" />

        <span className="mt-4 flex items-center gap-3">
          <AkSpinner className="size-4.75" />

          <AkTypography>{akMT('loading')}...</AkTypography>
        </span>
      </div>
    );
  }

  const rows = versions.data?.items ?? [];
  const total = versions.data?.count ?? 0;

  if (rows.length < 1) {
    return (
      <div
        className="flex w-full flex-col items-center bg-background px-6 py-12"
        data-test-sk-versions-empty
      >
        {isHistory ? (
          <HistoryTableEmpty aria-hidden="true" />
        ) : (
          <DetailsTableEmpty aria-hidden="true" />
        )}

        <AkTypography variant="h5" gutterBottom className="mt-6">
          <AkMessageTranslate id="notFound" />
        </AkTypography>

        <AkTypography align="center" className="max-w-125">
          {isHistory
            ? akMT('storeknox.monitoringHistoryTableEmpty')
            : akMT('storeknox.monitoringDetailsTableEmpty')}
        </AkTypography>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4" data-test-sk-versions-table>
      <AkTable
        columns={columns}
        data={rows}
        /* The previous page stays, dimmed, while the next one loads. */
        aria-busy={versions.isPlaceholderData}
        wrapperClassName={cn(versions.isPlaceholderData && 'opacity-60')}
        variant="full-bordered"
        borderColor="dark"
        dense
        getRowId={(version) => String(version.id)}
        caption={
          isHistory ? akMT('storeknox.monitoringHistory') : akMT('storeknox.monitoringDetails')
        }
        className="bg-background"
      />

      {isHistory && total > 5 && (
        <AkPagination
          totalItems={total}
          limit={page.limit}
          offset={page.offset}
          itemPerPageOptions={[5, 10, 20]}
          onPageChange={setPage}
          onItemPerPageChange={setPage}
          tableItemLabel={akMT('versions')}
          perPageLabel={akMT('recordPerPage')}
        />
      )}
    </div>
  );
}
