import {
  getRouteApi,
  Link,
  Outlet,
  useMatchRoute,
  useNavigate,
  useSearch,
} from '@tanstack/react-router';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkPagination, type AkPaginationPage } from '@irene/ui/ak-pagination';
import { AkTabs, AkTabsBadge, AkTabsList, AkTabsTrigger } from '@irene/ui/ak-tabs';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';
import NoPendingItems from '@irene/ui/svgs/no-pending-items.svg?react';
import ProjectListEmpty from '@irene/ui/svgs/project-list-empty.svg?react';
import ScanCompleted from '@irene/ui/svgs/scan-completed.svg?react';
import type { ApiSkFakeAppCounts } from '@irene/api/services/storeknox';

import {
  fakeAppTabQuery,
  skFakeAppsOptions,
  type FakeAppTab,
} from '@/features/storeknox/queries/fake-apps';

import { PageWrapper } from '@/components/page-wrapper';
import { DetailsBanner } from '@/features/storeknox/components/details-banner';
import { SkListEmpty } from '@/features/storeknox/components/list-empty';
import { useErrorToast } from '@/features/storeknox/hooks/use-error-toast';
import { skInventoryAppOptions } from '@/features/storeknox/queries/inventory';
import { hasSuspectedApps } from '@/features/storeknox/utils/fake-app';
import { readFakeAppTabPage } from '@/features/storeknox/utils/list-params';
import { fakeAppDetectionIsInitializing } from '@/features/storeknox/utils/sk-app';

import { FakeAppActionCell } from './components/fake-app-action-cell';
import { FakeAppListHeader } from './components/fake-app-list-header';
import { FakeAppListState } from './components/fake-app-list-state';
import { FakeAppTabTable } from './components/fake-app-tab-table';

const routeApi = getRouteApi('/_authenticated/dashboard_/storeknox/fake-apps/$skApp');

/* Which of the app's fake-app counts each tab lists. */
const _COUNT_KEY = {
  'brand-abuse': 'brand_abuse',
  'fake-app': 'fake_app',
  ignored: 'ignored',
} as const satisfies Record<FakeAppTab, keyof ApiSkFakeAppCounts>;

/** What each tab says above its table and in place of it when it has no copies. */
function _tabCopy(tab: FakeAppTab) {
  switch (tab) {
    case 'brand-abuse':
      return {
        info: akMT('storeknox.fakeApps.brandAbuseInfo'),
        emptyTitle: akMT('storeknox.fakeApps.noBrandAbuseFound'),
        emptyDescription: akMT('storeknox.fakeApps.noBrandAbuseFoundDescription'),
        illustration: <ScanCompleted aria-hidden="true" />,
      };
    case 'fake-app':
      return {
        info: akMT('storeknox.fakeApps.fakeAppsInfo'),
        emptyTitle: akMT('storeknox.fakeApps.noFakeAppsFound'),
        emptyDescription: akMT('storeknox.fakeApps.noFakeAppsFoundDescription'),
        illustration: <NoPendingItems aria-hidden="true" />,
      };
    case 'ignored':
      return {
        info: akMT('storeknox.fakeApps.ignoredInfo'),
        emptyTitle: akMT('storeknox.fakeApps.noIgnoredApps'),
        emptyDescription: akMT('storeknox.fakeApps.noIgnoredAppsDescription'),
        illustration: <ProjectListEmpty aria-hidden="true" />,
      };
  }
}

/**
 * The layout around one app's fake-app list: the warning banner, the header, then either the
 * in-progress or nothing-found state or the tabs with their counts. The tab outlet renders only
 * with the tabs, so an initializing app never requests a list, even through a deep link.
 */
export function FakeAppListLayout() {
  const { skApp } = routeApi.useParams();
  const { data: app } = useQuery(skInventoryAppOptions(skApp));
  const matchRoute = useMatchRoute();

  if (!app) {
    return null;
  }

  const counts = app.fake_app_counts;
  const showTabs = !fakeAppDetectionIsInitializing(app) && hasSuspectedApps(counts);

  const tabs = [
    {
      label: akMT('storeknox.brandAbuse'),
      to: '/dashboard/storeknox/fake-apps/$skApp',
      count: counts?.brand_abuse ?? 0,
      dot: cn('bg-brand-abuse'),
    },
    {
      label: akMT('storeknox.fakeApps.fakeApp'),
      to: '/dashboard/storeknox/fake-apps/$skApp/fake-apps',
      count: counts?.fake_app ?? 0,
      dot: cn('bg-fake-app'),
    },
    {
      label: akMT('storeknox.fakeApps.ignored'),
      to: '/dashboard/storeknox/fake-apps/$skApp/ignored',
      count: counts?.ignored ?? 0,
    },
  ] as const;

  const activeTab = tabs.find((tab) => matchRoute({ to: tab.to, params: { skApp } }))?.to ?? '';

  return (
    <div className="flex w-full flex-col" data-test-sk-fake-app-list>
      {/* Banner and header stick as one block so the header always sits under the banner. */}
      <div className="sticky top-0 z-10 flex flex-col bg-background-subtle">
        <DetailsBanner app={app} />

        <PageWrapper contentWidth="standard" className="pb-0">
          <FakeAppListHeader app={app} />
        </PageWrapper>
      </div>

      <PageWrapper contentWidth="standard" className="flex flex-col pt-0">
        {showTabs ? (
          <>
            <AkTabs value={activeTab} activationMode="manual" className="gap-0">
              <AkTabsList className="border border-b-0 border-border bg-background">
                {tabs.map((tab) => (
                  <AkTabsTrigger key={tab.to} value={tab.to} asChild>
                    <Link to={tab.to} params={{ skApp }}>
                      {'dot' in tab && (
                        <span aria-hidden="true" className={cn('size-3.5 rounded-xs', tab.dot)} />
                      )}

                      {tab.label}

                      <AkTabsBadge>{tab.count}</AkTabsBadge>
                    </Link>
                  </AkTabsTrigger>
                ))}
              </AkTabsList>
            </AkTabs>

            <Outlet />
          </>
        ) : (
          <FakeAppListState app={app} />
        )}
      </PageWrapper>
    </div>
  );
}

/**
 * One tab of an app's fake-app list: an info strip, the page of copies the tab asks the server
 * for, and pagination kept in the URL as `limit` and `offset`.
 *
 * @param props.tab - Which copies to list: the two classifications, or the ignored ones.
 */
export function FakeAppTabPage({ tab }: Readonly<{ tab: FakeAppTab }>) {
  const { skApp } = routeApi.useParams();
  const search = useSearch({ strict: false });
  const navigate = useNavigate();

  const page = readFakeAppTabPage(search);
  const apps = useQuery(skFakeAppsOptions(skApp, { ...page, ...fakeAppTabQuery(tab) }));
  const { data: app } = useQuery(skInventoryAppOptions(skApp));
  const copy = _tabCopy(tab);

  useErrorToast(apps.error);

  const total = apps.data?.count ?? 0;
  const loadedItems = apps.data?.items.length;

  /*
    The app already counts each tab's copies, so the first page draws as many placeholder rows as
    it will fill, and a tab counted empty shows its empty state without a placeholder table.
    Later pages keep the default, since the counts can drift from the list after an ignore.
  */
  const countedCopies = app?.fake_app_counts?.[_COUNT_KEY[tab]];
  const isFirstPage = page.offset === 0;

  const loadingRowCount =
    isFirstPage && countedCopies !== undefined ? Math.min(page.limit, countedCopies) : undefined;

  const countedEmpty = !apps.data && loadingRowCount === 0;

  const goToPage = ({ limit, offset }: AkPaginationPage) =>
    navigate({ to: '.', search: { limit, offset } });

  /* A page past the last one, such as after an ignore emptied it, steps back to the page before. */
  useEffect(() => {
    if (!apps.isPlaceholderData && loadedItems === 0 && total > 0 && page.offset > 0) {
      void navigate({
        to: '.',
        search: { limit: page.limit, offset: Math.max(0, page.offset - page.limit) || undefined },
        replace: true,
      });
    }
  }, [apps.isPlaceholderData, loadedItems, total, page.limit, page.offset, navigate]);

  /*
    irene leaves the placeholder rows up after a failed list; an error state says it failed. It
    comes before the empty checks: a tab the counts call empty whose list errored is still an
    error, since the counts could not be confirmed against the list.
  */
  if (apps.isError && !apps.data) {
    return <SkListEmpty header={akMT('somethingWentWrong')} illustration={copy.illustration} />;
  }

  if ((apps.data && total === 0) || countedEmpty) {
    return (
      <SkListEmpty
        header={copy.emptyTitle}
        subText={copy.emptyDescription}
        illustration={copy.illustration}
      />
    );
  }

  return (
    <div className="flex flex-col bg-background" data-test-sk-fake-app-tab={tab}>
      <div className="border-x border-border p-2">
        <AkTypography>{copy.info}</AkTypography>
      </div>

      <FakeAppTabTable
        skAppId={skApp}
        apps={apps.data?.items}
        busy={apps.isPlaceholderData}
        loadingRowCount={loadingRowCount}
        renderAction={
          tab === 'ignored'
            ? undefined
            : (fakeApp) => <FakeAppActionCell skAppId={skApp} fakeApp={fakeApp} />
        }
      />

      {apps.data && (
        <AkPagination
          totalItems={total}
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
