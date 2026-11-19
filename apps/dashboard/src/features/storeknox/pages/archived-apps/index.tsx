import { useQuery } from '@tanstack/react-query';
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkBreadcrumbs, AkBreadcrumbsItem } from '@irene/ui/ak-breadcrumbs';
import { AkPagination, type AkPaginationPage } from '@irene/ui/ak-pagination';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkTable } from '@irene/ui/ak-table';
import { createAkTableColumns } from '@irene/ui/ak-table/helpers';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';

import { PageWrapper } from '@/components/page-wrapper';
import { SkListEmpty } from '@/features/storeknox/components/list-empty';
import { SkApplicationCell, SkStoreCell } from '@/features/storeknox/components/table-cells';
import { useErrorToast } from '@/features/storeknox/hooks/use-error-toast';
import { skArchivedAppsOptions } from '@/features/storeknox/queries/inventory';
import { skStoreTableColumnShares } from '@/features/storeknox/utils/column-widths';
import { readListPage } from '@/features/storeknox/utils/list-params';
import { buildSkLoadingRows, type SkAppTableRow } from '@/features/storeknox/utils/table-rows';

import { UnarchiveCell } from './components/unarchive-cell';

const routeApi = getRouteApi('/_authenticated/dashboard_/storeknox/inventory_/archived-apps');
const column = createAkTableColumns<SkAppTableRow>();

const [STORE_WIDTH, APPLICATION_WIDTH, ARCHIVED_BY_WIDTH, ARCHIVED_ON_WIDTH, ACTION_WIDTH] =
  skStoreTableColumnShares([300, 200, 200, undefined]);

function _TextCell({ loading, children }: Readonly<{ loading: boolean; children: string }>) {
  return loading ? (
    <AkSkeleton width="100px" height="20px" />
  ) : (
    <AkTypography>{children}</AkTypography>
  );
}

/**
 * The apps archived out of the inventory: who archived each and when, with a
 * way to restore it once its lock period has passed. A row opens the app.
 */
export function ArchivedAppsPage() {
  const search = routeApi.useSearch();
  const navigate = useNavigate();

  const page = readListPage(search);
  const apps = useQuery(skArchivedAppsOptions(page));

  useErrorToast(apps.error, akMT('storeknox.archivedAppsLoadFailed'));

  const isLoading = apps.isPending;
  const totalCount = apps.data?.count ?? 0;

  const goToPage = ({ limit, offset }: AkPaginationPage) =>
    navigate({ to: '.', search: { app_limit: limit, app_offset: offset } });

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
      id: 'archived-by',
      header: () => akMT('storeknox.archivedBy'),
      cell: ({ row }) => (
        <_TextCell loading={!row.original.app}>{row.original.app?.archived_by ?? ''}</_TextCell>
      ),
      meta: { width: ARCHIVED_BY_WIDTH },
    }),
    column.display({
      id: 'archived-on',
      header: () => akMT('storeknox.dateOfArchive'),
      cell: ({ row }) => (
        <_TextCell loading={!row.original.app}>
          {formatDateTime(row.original.app?.archived_on, 'longDate')}
        </_TextCell>
      ),
      meta: { width: ARCHIVED_ON_WIDTH },
    }),
    column.display({
      id: 'action',
      header: () => akMT('action'),
      cell: ({ row }) => (
        <UnarchiveCell
          app={row.original.app}
          onUnarchived={() => goToPage({ limit: page.limit, offset: 0 })}
        />
      ),
      meta: { width: ACTION_WIDTH },
    }),
  ]);

  const rows: SkAppTableRow[] = isLoading
    ? buildSkLoadingRows(7)
    : (apps.data?.items.map((app) => ({ app })) ?? []);

  return (
    <PageWrapper contentWidth="standard" className="flex flex-col" data-test-sk-archived-apps>
      <AkBreadcrumbs aria-label={akMT('storeknox.archivedApps')} className="my-3.5">
        <AkBreadcrumbsItem asChild>
          <Link to="/dashboard/storeknox/inventory/app-list">
            <AkMessageTranslate id="storeknox.appInventory" />
          </Link>
        </AkBreadcrumbsItem>

        <AkBreadcrumbsItem current>
          <AkMessageTranslate id="storeknox.archivedApps" />
        </AkBreadcrumbsItem>
      </AkBreadcrumbs>

      <div className="my-2.5 flex flex-col gap-1 border border-border bg-background p-5">
        <AkTypography tag="h1" variant="subtitle1">
          <AkMessageTranslate id="storeknox.archivedApps" />
        </AkTypography>

        <AkTypography variant="body2" color="neutral">
          <AkMessageTranslate id="storeknox.archivedAppsDescription" />
        </AkTypography>
      </div>

      {!isLoading && totalCount === 0 ? (
        <SkListEmpty
          header={akMT('storeknox.noArchivedAppsFound')}
          subText={akMT('storeknox.noArchivedAppsFoundDescription')}
        />
      ) : (
        <div className="flex flex-col bg-background">
          <AkTable
            columns={columns}
            data={rows}
            /* The previous page stays, dimmed, while the next one loads. */
            aria-busy={apps.isPlaceholderData}
            wrapperClassName={cn(apps.isPlaceholderData && 'opacity-60')}
            hoverable={!isLoading}
            caption={akMT('storeknox.archivedApps')}
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
      )}
    </PageWrapper>
  );
}
