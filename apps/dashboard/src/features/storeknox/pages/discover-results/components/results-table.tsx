import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkPagination, type AkPaginationPage } from '@irene/ui/ak-pagination';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkTable } from '@irene/ui/ak-table';
import { createAkTableColumns } from '@irene/ui/ak-table/helpers';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';
import NoApiUrlFilter from '@irene/ui/svgs/no-api-url-filter.svg?react';
import type { ApiSkDiscoveryResult } from '@irene/api/services/storeknox';

import {
  SkApplicationCell,
  SkDeveloperCell,
  SkStoreCell,
} from '@/features/storeknox/components/table-cells';

import { SkListEmpty } from '@/features/storeknox/components/list-empty';
import { useErrorToast } from '@/features/storeknox/hooks/use-error-toast';
import { skDiscoveryResultsOptions } from '@/features/storeknox/queries/discovery';
import { skStoreTableColumnShares } from '@/features/storeknox/utils/column-widths';
import { discoveryResultAsCellApp } from '@/features/storeknox/utils/discovery';
import type { SkAppListPage } from '@/features/storeknox/queries/inventory';

import { ResultActionCell } from './result-action-cell';
import { ResultActionHeader } from './result-action-header';

/** One row of the results; a row with no result stands in for one still loading. */
interface ResultRow {
  result?: ApiSkDiscoveryResult;
}

const column = createAkTableColumns<ResultRow>();

/* irene's checkbox column is commented out, waiting for bulk additions, so it is not built. */
const [STORE_WIDTH, APPLICATION_WIDTH, DEVELOPER_WIDTH, ACTION_WIDTH] = skStoreTableColumnShares([
  200, 200, 50,
]);

const LOADING_ROWS: ResultRow[] = Array.from({ length: 5 }, () => ({}));

interface ResultsTableProps {
  query: string;
  searchId: string;
  page: SkAppListPage;
  onPageChange: (page: AkPaginationPage) => void;
}

/** A page of one store search's results, with the query above and each listing's action. */
export function ResultsTable({ query, searchId, page, onPageChange }: Readonly<ResultsTableProps>) {
  const results = useQuery(skDiscoveryResultsOptions(searchId, page));

  useErrorToast(results.error);

  const isLoading = results.isPending;
  const totalCount = results.data?.count ?? 0;

  /* Built once per search, since new cell functions each render remount the cells and drop a tooltip mid-hover. */
  const columns = useMemo(
    () =>
      column.columns([
        column.display({
          id: 'store',
          header: () => <AkMessageTranslate id="storeknox.store" />,
          cell: ({ row }) => (
            <SkStoreCell
              app={row.original.result && discoveryResultAsCellApp(row.original.result)}
            />
          ),
          meta: { width: STORE_WIDTH, align: 'center' },
        }),
        column.display({
          id: 'application',
          header: () => akMT('application'),
          cell: ({ row }) => (
            <SkApplicationCell
              app={row.original.result && discoveryResultAsCellApp(row.original.result)}
            />
          ),
          meta: { width: APPLICATION_WIDTH },
        }),
        column.display({
          id: 'developer',
          header: () => akMT('developer'),
          cell: ({ row }) => (
            <SkDeveloperCell
              app={row.original.result && discoveryResultAsCellApp(row.original.result)}
            />
          ),
          meta: { width: DEVELOPER_WIDTH },
        }),
        column.display({
          id: 'action',
          header: () => <ResultActionHeader />,
          cell: ({ row }) => <ResultActionCell result={row.original.result} searchId={searchId} />,
          meta: { width: ACTION_WIDTH, align: 'center' },
        }),
      ]),
    [searchId]
  );

  const rows: ResultRow[] = isLoading
    ? LOADING_ROWS
    : (results.data?.items.map((result) => ({ result })) ?? []);

  return (
    <div className="flex flex-col" data-test-sk-discovery-results>
      <div className="flex items-center border-x border-border bg-background p-3.5">
        {isLoading ? (
          <AkSkeleton width="250px" height="16px" />
        ) : (
          <AkTypography variant="h5" fontWeight="regular">
            <AkMessageTranslate id="storeknox.showingResults" />{' '}
            <strong className="font-semibold">&quot;{query}&quot;</strong>
          </AkTypography>
        )}
      </div>

      {!isLoading && totalCount === 0 ? (
        <div className="border border-t-0 border-border">
          <SkListEmpty
            illustration={<NoApiUrlFilter aria-hidden="true" />}
            header={akMT('storeknox.noResultFound')}
            subText={akMT('storeknox.noResultFoundDescription')}
          />
        </div>
      ) : (
        <div className="flex flex-col bg-background">
          <AkTable
            columns={columns}
            data={rows}
            getRowId={(row, index) => row.result?.doc_ulid ?? String(index)}
            caption={akMT('storeknox.discoveryResults')}
            aria-busy={results.isPlaceholderData}
            wrapperClassName={cn(results.isPlaceholderData && 'opacity-60')}
            className="[&_tbody_tr]:border [&_tbody_tr]:border-t-0 [&_tbody_tr]:border-border"
          />

          {!isLoading && (
            <AkPagination
              totalItems={totalCount}
              limit={page.limit}
              offset={page.offset}
              itemPerPageOptions={[10, 25, 50]}
              onPageChange={onPageChange}
              onItemPerPageChange={onPageChange}
              tableItemLabel={akMT('apps')}
              perPageLabel={akMT('recordPerPage')}
            />
          )}
        </div>
      )}
    </div>
  );
}
