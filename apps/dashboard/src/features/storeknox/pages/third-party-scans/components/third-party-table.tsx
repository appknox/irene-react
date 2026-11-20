import { useNavigate } from '@tanstack/react-router';

import { ENUMS } from '@irene/enums';
import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkPagination, type AkPaginationPage } from '@irene/ui/ak-pagination';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkTable } from '@irene/ui/ak-table';
import { createAkTableColumns } from '@irene/ui/ak-table/helpers';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';
import type { ApiSkThirdPartyApp } from '@irene/api/services/storeknox';

import {
  SkApplicationCell,
  SkDeveloperCell,
  SkStoreCell,
  type SkCellApp,
} from '@/features/storeknox/components/table-cells';

import { ireneColumnShares } from '@/features/storeknox/utils/column-widths';
import type { ThirdPartyListSearch } from '@/features/storeknox/utils/third-party';

import { RiskStatusChip } from './risk-status-chip';

/** One row of the table; a row with no app is a loading placeholder. */
interface ThirdPartyTableRow {
  app?: ApiSkThirdPartyApp;
}

interface ThirdPartyTableProps {
  /** The page of apps, or nothing while it loads. */
  apps?: ApiSkThirdPartyApp[];
  totalCount: number;
  limit: number;
  offset: number;

  /** The resolved region, which a row carries to the app's details. */
  region: string;

  /** The list's search as it is now, which a row carries so the details can return to it. */
  listSearch: ThirdPartyListSearch;

  /** Whether the shown page is the previous one, kept while the next loads. */
  isRefreshing: boolean;
  onPageChange: (page: AkPaginationPage) => void;
}

const column = createAkTableColumns<ThirdPartyTableRow>();

/* irene's widths for store, application, developer, risk score and risk status. */
const [STORE_WIDTH, APPLICATION_WIDTH, DEVELOPER_WIDTH, SCORE_WIDTH, STATUS_WIDTH] =
  ireneColumnShares([80, 300, 250, 150, 150]);

const LOADING_ROWS: ThirdPartyTableRow[] = Array.from({ length: 7 }, () => ({}));

/*
  A scanned app in the shape the shared cells read. Its platform follows the store it was scanned
  in; the scan carries no developer email, which the developer cell does not show here.
*/
const _asCellApp = (app: ApiSkThirdPartyApp): SkCellApp => ({
  app_metadata: {
    url: app.app_url,
    icon_url: app.icon_url,
    package_name: app.package_name,
    title: app.title,
    platform: app.store === 'appstore' ? ENUMS.PLATFORM.IOS : ENUMS.PLATFORM.ANDROID,
    dev_name: app.dev_name,
    dev_email: '',
  },
});

/**
 * The scanned third-party apps of one store and region, a row each with its score and risk status.
 * A row opens the app's details, in the store it was scanned in and the region the list shows.
 */
export function ThirdPartyTable({
  apps,
  totalCount,
  limit,
  offset,
  region,
  listSearch,
  isRefreshing,
  onPageChange,
}: Readonly<ThirdPartyTableProps>) {
  const navigate = useNavigate();
  const isLoading = !apps;

  const columns = column.columns([
    column.display({
      id: 'store',
      header: () => <AkMessageTranslate id="storeknox.store" />,
      cell: ({ row }) => <SkStoreCell app={row.original.app && _asCellApp(row.original.app)} />,
      meta: { width: STORE_WIDTH, align: 'center' },
    }),
    column.display({
      id: 'application',
      header: () => akMT('application'),
      cell: ({ row }) => (
        <SkApplicationCell app={row.original.app && _asCellApp(row.original.app)} />
      ),
      meta: { width: APPLICATION_WIDTH },
    }),
    column.display({
      id: 'developer',
      header: () => akMT('developer'),
      cell: ({ row }) => (
        <SkDeveloperCell app={row.original.app && _asCellApp(row.original.app)} hideDevEmail />
      ),
      meta: { width: DEVELOPER_WIDTH },
    }),
    column.display({
      id: 'risk-score',
      header: () => akMT('riskScore'),
      cell: ({ row }) => {
        const app = row.original.app;

        if (!app) {
          return <AkSkeleton width="60px" height="16px" />;
        }

        return (
          <AkTypography fontWeight="bold" data-test-sk-risk-score>
            {app.score === null ? akMT('storeknox.riskScoreUnavailable') : `${app.score}/100`}
          </AkTypography>
        );
      },
      meta: { width: SCORE_WIDTH },
    }),
    column.display({
      id: 'risk-status',
      header: () => akMT('riskStatus'),
      cell: ({ row }) =>
        row.original.app ? (
          <RiskStatusChip status={row.original.app.risk_status} />
        ) : (
          <AkSkeleton width="100px" height="24px" />
        ),
      meta: { width: STATUS_WIDTH },
    }),
  ]);

  return (
    <div className="flex flex-col border border-border bg-background">
      <AkTable
        columns={columns}
        data={isLoading ? LOADING_ROWS : apps.map((app) => ({ app }))}
        /* The previous page stays, dimmed, while the next one loads. */
        aria-busy={isLoading || isRefreshing}
        wrapperClassName={cn(isRefreshing && 'opacity-60')}
        hoverable={!isLoading}
        caption={akMT('storeknox.thirdPartyScansTitle')}
        onRowClick={
          isLoading
            ? undefined
            : (row) =>
                row.app &&
                navigate({
                  to: '/dashboard/storeknox/third-party-scans/$packageName',
                  params: { packageName: row.app.package_name },
                  search: { tp_store: row.app.store, tp_region: region },
                  state: { thirdPartyListSearch: listSearch },
                })
        }
      />

      {!isLoading && (
        <AkPagination
          totalItems={totalCount}
          limit={limit}
          offset={offset}
          itemPerPageOptions={[10, 25, 50]}
          onPageChange={onPageChange}
          onItemPerPageChange={onPageChange}
          tableItemLabel={akMT('apps')}
          perPageLabel={akMT('recordPerPage')}
        />
      )}
    </div>
  );
}
