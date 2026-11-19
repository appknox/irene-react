import { useQuery } from '@tanstack/react-query';
import { getRouteApi, useNavigate } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkPagination, type AkPaginationPage } from '@irene/ui/ak-pagination';
import { AkTable } from '@irene/ui/ak-table';
import { createAkTableColumns } from '@irene/ui/ak-table/helpers';
import { cn } from '@irene/ui/cn';

import {
  SkApplicationCell,
  SkDeveloperCell,
  SkStoreCell,
} from '@/features/storeknox/components/table-cells';

import { SkListEmpty } from '@/features/storeknox/components/list-empty';
import { useErrorToast } from '@/features/storeknox/hooks/use-error-toast';
import { skInventoryAppsOptions } from '@/features/storeknox/queries/inventory';
import { skStoreTableColumnShares } from '@/features/storeknox/utils/column-widths';
import { readInventoryListParams } from '@/features/storeknox/utils/list-params';
import { buildSkLoadingRows, type SkAppTableRow } from '@/features/storeknox/utils/table-rows';
import { storeknoxOrganizationOptions } from '@/queries/organization';

import { MonitoringStatusCell } from './components/monitoring-status-cell';
import { MonitoringStatusHeader } from './components/monitoring-status-header';

const routeApi = getRouteApi('/_authenticated/dashboard_/storeknox/inventory/app-list');
const column = createAkTableColumns<SkAppTableRow>();

const [STORE_WIDTH, APPLICATION_WIDTH, DEVELOPER_WIDTH, STATUS_WIDTH] = skStoreTableColumnShares([
  300, 250, 150,
]);

/** The inventory: approved apps that are active or gone from their store, filterable by monitoring status. */
export function InventoryAppListPage() {
  const search = routeApi.useSearch();
  const navigate = useNavigate();

  const params = readInventoryListParams(search);
  const apps = useQuery(skInventoryAppsOptions(params));
  const { data: storeknoxOrganization } = useQuery(storeknoxOrganizationOptions());

  useErrorToast(apps.error, akMT('storeknox.inventoryLoadFailed'));

  const isLoading = apps.isPending;
  const filterApplied = params.monitoringStatus > -1;
  const totalCount = apps.data?.count ?? 0;
  const hasNoApps = !isLoading && totalCount === 0;
  const detectsFakeApps = Boolean(storeknoxOrganization?.sk_features.fake_app_detection);

  const goToPage = (page: AkPaginationPage, monitoringStatus = params.monitoringStatus) =>
    navigate({
      to: '.',
      search: {
        app_limit: page.limit,
        app_offset: page.offset,
        monitoring_status: monitoringStatus,
      },
    });

  const columns = column.columns([
    column.display({
      id: 'store',
      header: () => <AkMessageTranslate id="storeknox.store" />,
      cell: ({ row }) => <SkStoreCell app={row.original.app} />,
      meta: { width: STORE_WIDTH, align: 'center' },
    }),
    column.display({
      id: 'application',
      header: () => akMT('application'),
      cell: ({ row }) => (
        <SkApplicationCell app={row.original.app} detailsId={row.original.app?.id} />
      ),
      meta: { width: APPLICATION_WIDTH },
    }),
    column.display({
      id: 'developer',
      header: () => akMT('developer'),
      cell: ({ row }) => <SkDeveloperCell app={row.original.app} />,
      meta: { width: DEVELOPER_WIDTH },
    }),
    column.display({
      id: 'monitoring-status',
      header: () => (
        <MonitoringStatusHeader
          selected={params.monitoringStatus}
          onStatusChange={(status) => goToPage({ limit: params.limit, offset: 0 }, status)}
        />
      ),
      cell: ({ row }) => (
        <MonitoringStatusCell app={row.original.app} detectsFakeApps={detectsFakeApps} />
      ),
      meta: { width: STATUS_WIDTH, align: 'left' },
    }),
  ]);

  if (hasNoApps && !filterApplied) {
    return (
      <SkListEmpty
        header={akMT('storeknox.noInventoryAppsFound')}
        subText={akMT('storeknox.noInventoryAppsFoundDescription')}
      />
    );
  }

  const rows: SkAppTableRow[] = isLoading
    ? buildSkLoadingRows(7)
    : (apps.data?.items.map((app) => ({ app })) ?? []);

  const showEmptyState = hasNoApps && filterApplied;

  return (
    <div className="flex flex-col border border-t-0 border-border bg-background">
      <AkTable
        columns={columns}
        data={rows}
        /* The previous page stays, dimmed, while the next one loads. */
        aria-busy={apps.isPlaceholderData}
        wrapperClassName={cn(apps.isPlaceholderData && 'opacity-60')}
        hoverable={!isLoading}
        caption={akMT('storeknox.appInventory')}
        onRowClick={
          isLoading
            ? undefined
            : (row) =>
                row.app &&
                navigate({
                  to: '/dashboard/storeknox/inventory-details/$id',
                  params: { id: String(row.app.id) },
                })
        }
      />

      {showEmptyState && (
        <SkListEmpty
          header={akMT('storeknox.noInventoryAppsFound')}
          subText={akMT('storeknox.noAppMatchesYourCurrentFilter')}
        />
      )}

      {!showEmptyState && !isLoading && (
        <AkPagination
          totalItems={totalCount}
          limit={params.limit}
          offset={params.offset}
          itemPerPageOptions={[10, 25, 50]}
          onPageChange={(page) => goToPage(page)}
          onItemPerPageChange={(page) => goToPage(page)}
          tableItemLabel={akMT('apps')}
          perPageLabel={akMT('recordPerPage')}
        />
      )}
    </div>
  );
}
