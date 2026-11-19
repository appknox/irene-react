import { useQuery } from '@tanstack/react-query';
import { getRouteApi, useNavigate } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkPagination, type AkPaginationPage } from '@irene/ui/ak-pagination';
import { AkTable } from '@irene/ui/ak-table';
import { createAkTableColumns } from '@irene/ui/ak-table/helpers';
import { cn } from '@irene/ui/cn';
import type { ApiSkRequestedApp } from '@irene/api/services/storeknox';

import {
  SkApplicationCell,
  SkDeveloperCell,
  SkStoreCell,
} from '@/features/storeknox/components/table-cells';

import { SkListEmpty } from '@/features/storeknox/components/list-empty';
import { useErrorToast } from '@/features/storeknox/hooks/use-error-toast';
import { skRequestedAppsOptions } from '@/features/storeknox/queries/discovery';
import { skStoreTableColumnShares } from '@/features/storeknox/utils/column-widths';
import { readListPage } from '@/features/storeknox/utils/list-params';

import { RequestStatusCell } from './components/request-status-cell';

const routeApi = getRouteApi('/_authenticated/dashboard_/storeknox/discover/requested');

/** One row of the requests; a row with no request stands in for one still loading. */
interface RequestRow {
  request?: ApiSkRequestedApp;
}

const column = createAkTableColumns<RequestRow>();

const [STORE_WIDTH, APPLICATION_WIDTH, DEVELOPER_WIDTH, STATUS_WIDTH] = skStoreTableColumnShares([
  undefined,
  undefined,
  80,
]);

const COLUMNS = column.columns([
  column.display({
    id: 'store',
    header: () => <AkMessageTranslate id="storeknox.store" />,
    cell: ({ row }) => <SkStoreCell app={row.original.request} />,
    meta: { width: STORE_WIDTH, align: 'center' },
  }),
  column.display({
    id: 'application',
    header: () => akMT('application'),
    cell: ({ row }) => <SkApplicationCell app={row.original.request} />,
    meta: { width: APPLICATION_WIDTH },
  }),
  column.display({
    id: 'developer',
    header: () => akMT('developer'),
    cell: ({ row }) => <SkDeveloperCell app={row.original.request} />,
    meta: { width: DEVELOPER_WIDTH },
  }),
  column.display({
    id: 'status',
    header: () => akMT('status'),
    cell: ({ row }) => <RequestStatusCell request={row.original.request} />,
    meta: { width: STATUS_WIDTH },
  }),
]);

const LOADING_ROWS: RequestRow[] = Array.from({ length: 5 }, () => ({}));

/** The apps the signed-in member has requested, with each request's status; the route sends an owner to the search. */
export function DiscoverRequestedPage() {
  const search = routeApi.useSearch();
  const navigate = useNavigate();

  const page = readListPage(search);
  const requests = useQuery(skRequestedAppsOptions(page));

  useErrorToast(requests.error);

  const isLoading = requests.isPending;
  const totalCount = requests.data?.count ?? 0;

  const goToPage = ({ limit, offset }: AkPaginationPage) =>
    navigate({ to: '.', search: { app_limit: limit, app_offset: offset } });

  if (!isLoading && totalCount <= 0) {
    return (
      <div className="border border-border">
        <SkListEmpty
          header={akMT('storeknox.noRequestedAppsFound')}
          subText={<AkMessageTranslate id="storeknox.noRequestedAppsFoundDescription" />}
        />
      </div>
    );
  }

  const rows: RequestRow[] = isLoading
    ? LOADING_ROWS
    : (requests.data?.items.map((request) => ({ request })) ?? []);

  return (
    <div className="flex flex-col bg-background" data-test-sk-requested-apps>
      <AkTable
        columns={COLUMNS}
        data={rows}
        caption={akMT('storeknox.requestedApps')}
        aria-busy={requests.isPlaceholderData}
        wrapperClassName={cn(requests.isPlaceholderData && 'opacity-60')}
        className="[&_tbody_tr]:border [&_tbody_tr]:border-t-0 [&_tbody_tr]:border-border"
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
