import { useQuery } from '@tanstack/react-query';
import { getRouteApi, useNavigate } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkPagination, type AkPaginationPage } from '@irene/ui/ak-pagination';
import { AkTable } from '@irene/ui/ak-table';
import { createAkTableColumns } from '@irene/ui/ak-table/helpers';
import { cn } from '@irene/ui/cn';
import NoPendingItems from '@irene/ui/svgs/no-pending-items.svg?react';

import { SkListEmpty } from '@/features/storeknox/components/list-empty';
import { SkApplicationCell, SkStoreCell } from '@/features/storeknox/components/table-cells';
import { useErrorToast } from '@/features/storeknox/hooks/use-error-toast';
import { skPendingReviewAppsOptions } from '@/features/storeknox/queries/inventory';
import { skStoreTableColumnShares } from '@/features/storeknox/utils/column-widths';
import { readListPage } from '@/features/storeknox/utils/list-params';
import { buildSkLoadingRows, type SkAppTableRow } from '@/features/storeknox/utils/table-rows';

import { RequestedByCell } from './components/requested-by-cell';
import { ReviewDecisionCell } from './components/review-decision-cell';

const routeApi = getRouteApi('/_authenticated/dashboard_/storeknox/inventory/pending-reviews');
const column = createAkTableColumns<SkAppTableRow>();

/* irene's checkbox and availability columns are commented out, waiting for bulk decisions, so neither is built. */
const [STORE_WIDTH, APPLICATION_WIDTH, REQUESTED_BY_WIDTH, STATUS_WIDTH] = skStoreTableColumnShares(
  [200, undefined, 80]
);

const COLUMNS = column.columns([
  column.display({
    id: 'store',
    header: () => <AkMessageTranslate id="storeknox.store" />,
    cell: ({ row }) => <SkStoreCell app={row.original.app} />,
    meta: { width: STORE_WIDTH, align: 'center' },
  }),
  column.display({
    id: 'application',
    header: () => akMT('application'),
    cell: ({ row }) => <SkApplicationCell app={row.original.app} />,
    meta: { width: APPLICATION_WIDTH },
  }),
  column.display({
    id: 'requested-by',
    header: () => <AkMessageTranslate id="storeknox.requestedBy" />,
    cell: ({ row }) => <RequestedByCell app={row.original.app} />,
    meta: { width: REQUESTED_BY_WIDTH },
  }),
  column.display({
    id: 'status',
    header: () => akMT('status'),
    cell: ({ row }) => <ReviewDecisionCell app={row.original.app} />,
    meta: { width: STATUS_WIDTH, align: 'center' },
  }),
]);

/**
 * The apps waiting for an owner to approve or reject them, from
 * auto-discovery or a member's search.
 */
export function InventoryPendingReviewsPage() {
  const search = routeApi.useSearch();
  const navigate = useNavigate();

  const page = readListPage(search);
  const apps = useQuery(skPendingReviewAppsOptions(page));

  useErrorToast(apps.error);

  const isLoading = apps.isPending;
  const totalCount = apps.data?.count ?? 0;

  const goToPage = ({ limit, offset }: AkPaginationPage) =>
    navigate({ to: '.', search: { app_limit: limit, app_offset: offset } });

  if (!isLoading && totalCount === 0) {
    return (
      <div className="border border-t-0 border-border">
        <SkListEmpty
          illustration={<NoPendingItems aria-hidden="true" />}
          header={akMT('storeknox.noPendingItems')}
          subText={akMT('storeknox.noPendingItemsDescription')}
        />
      </div>
    );
  }

  const rows: SkAppTableRow[] = isLoading
    ? buildSkLoadingRows(5)
    : (apps.data?.items.map((app) => ({ app })) ?? []);

  return (
    <div className="flex flex-col border border-t-0 border-border bg-background">
      <AkTable
        columns={COLUMNS}
        data={rows}
        /* The previous page stays, dimmed, while the next one loads. */
        aria-busy={apps.isPlaceholderData}
        wrapperClassName={cn(apps.isPlaceholderData && 'opacity-60')}
        caption={akMT('storeknox.pendingReview')}
        className="[&_tbody_tr]:border [&_tbody_tr]:border-t-0 [&_tbody_tr]:border-divider"
      />

      {!isLoading && (
        <AkPagination
          totalItems={totalCount}
          limit={page.limit}
          offset={page.offset}
          itemPerPageOptions={[10, 25, 50]}
          onPageChange={goToPage}
          onItemPerPageChange={goToPage}
          tableItemLabel={akMT('apps')}
          perPageLabel={akMT('recordPerPage')}
        />
      )}
    </div>
  );
}
