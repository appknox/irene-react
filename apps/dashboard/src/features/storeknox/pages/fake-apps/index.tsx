import { useQuery } from '@tanstack/react-query';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkChip } from '@irene/ui/ak-chip';
import { AkPagination, type AkPaginationPage } from '@irene/ui/ak-pagination';
import { AkTypography } from '@irene/ui/ak-typography';

import { PageWrapper } from '@/components/page-wrapper';
import { PoweredByAiDrawer, type PoweredByAiSection } from '@/components/powered-by-ai';
import { SkListEmpty } from '@/features/storeknox/components/list-empty';
import { ListingSearch } from '@/features/storeknox/components/listing-search';
import { useErrorToast } from '@/features/storeknox/hooks/use-error-toast';
import { skFakeAppInventoryOptions } from '@/features/storeknox/queries/fake-apps';
import { readFakeAppInventoryParams } from '@/features/storeknox/utils/list-params';

import { FakeAppInventoryCard } from './components/fake-app-inventory-card';
import { FakeAppInventoryCardSkeleton } from './components/fake-app-inventory-card-skeleton';

const routeApi = getRouteApi('/_authenticated/dashboard_/storeknox/fake-apps/');

const SKELETON_CARDS = [1, 2, 3, 4, 5, 6];

/** What the AI behind fake-app detection reads, does with it and protects, in the drawer's order. */
const _buildAiSections = (): PoweredByAiSection[] => [
  {
    title: akMT('storeknox.fakeApps.aiDataAccess'),
    body: akMT('storeknox.fakeApps.aiDataAccessDescription'),
  },
  {
    title: akMT('storeknox.fakeApps.aiDataUsage'),
    body: akMT('storeknox.fakeApps.aiDataUsageDescription'),
  },
  {
    title: akMT('storeknox.fakeApps.aiDataProtection'),
    points: [
      akMT('storeknox.fakeApps.aiDataProtectionList.item1'),
      akMT('storeknox.fakeApps.aiDataProtectionList.item2'),
      akMT('storeknox.fakeApps.aiDataProtectionList.item3'),
    ],
  },
];

/**
 * The inventory apps brand-abuse and fake-app detection reports on, as a searchable grid of cards.
 *
 * The page and the search live in the URL (`app_limit`, `app_offset`, `q`), so the list can be
 * linked to and survives back and forward; searching returns to the first page.
 */
export function FakeAppsListingPage() {
  const search = routeApi.useSearch();
  const navigate = useNavigate();

  const params = readFakeAppInventoryParams(search);
  const apps = useQuery(skFakeAppInventoryOptions(params));

  useErrorToast(apps.error);

  const isLoading = apps.isPending;
  const totalCount = apps.data?.count ?? 0;
  const showEmptyState = !isLoading && totalCount === 0;

  const searchFor = useCallback(
    (query: string) =>
      navigate({
        to: '.',
        search: (previous) => ({ ...previous, q: query || undefined, app_offset: undefined }),
      }),
    [navigate]
  );

  const goToPage = ({ limit, offset }: AkPaginationPage) =>
    navigate({
      to: '.',
      search: (previous) => ({ ...previous, app_limit: limit, app_offset: offset }),
    });

  return (
    <PageWrapper contentWidth="wide" data-test-sk-fake-apps>
      <div
        className="
          my-2.5 flex items-center justify-between gap-4 border border-border bg-background p-5
        "
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <AkTypography tag="h1" variant="subtitle1">
              <AkMessageTranslate id="storeknox.fakeAppsTitle" />
            </AkTypography>

            <AkChip
              variant="outlined"
              size="small"
              label={akMT('beta')}
              className="border-beta-surface bg-beta-surface text-beta"
            />
          </div>

          <AkTypography variant="body2" color="neutral">
            <AkMessageTranslate id="storeknox.fakeApps.listingPageDescription" />
          </AkTypography>
        </div>

        <div className="flex items-center gap-3">
          <ListingSearch query={search.q ?? ''} onSearch={searchFor} />

          <PoweredByAiDrawer sections={_buildAiSections()} />
        </div>
      </div>

      {showEmptyState && (
        <div className="border border-border">
          <SkListEmpty
            header={akMT('storeknox.noSuspectedBrandAbuseFakeAppsFound')}
            subText={
              search.q
                ? akMT('storeknox.noSuspectedBrandAbuseFakeAppsFoundDescriptionWithSearch')
                : akMT('storeknox.noSuspectedBrandAbuseFakeAppsFoundDescription')
            }
          />
        </div>
      )}

      <div
        className="grid grid-cols-[repeat(auto-fill,minmax(430px,1fr))] gap-5.25"
        aria-busy={isLoading || apps.isPlaceholderData}
      >
        {isLoading
          ? SKELETON_CARDS.map((index) => <FakeAppInventoryCardSkeleton key={index} />)
          : apps.data?.items.map((app) => <FakeAppInventoryCard key={app.id} app={app} />)}
      </div>

      {!isLoading && !showEmptyState && (
        <AkPagination
          totalItems={totalCount}
          limit={params.limit}
          offset={params.offset}
          itemPerPageOptions={[12, 24, 48]}
          onPageChange={goToPage}
          onItemPerPageChange={goToPage}
          tableItemLabel={akMT('apps')}
          perPageLabel={akMT('recordPerPage')}
        />
      )}
    </PageWrapper>
  );
}
