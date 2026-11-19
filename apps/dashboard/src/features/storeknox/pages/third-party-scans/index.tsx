import { useQuery } from '@tanstack/react-query';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiSkThirdPartyAppsRequest } from '@irene/api/services/storeknox';
import type { AkPaginationPage } from '@irene/ui/ak-pagination';

import {
  skThirdPartyAppsOptions,
  skThirdPartyConfigOptions,
} from '@/features/storeknox/queries/third-party';

import {
  hasThirdPartyScope,
  resolveThirdPartyScope,
  riskStatusLabel,
  type ThirdPartyListSearch,
} from '@/features/storeknox/utils/third-party';

import { PageWrapper } from '@/components/page-wrapper';
import { SkListEmpty } from '@/features/storeknox/components/list-empty';
import { ListingSearch } from '@/features/storeknox/components/listing-search';
import { useErrorToast } from '@/features/storeknox/hooks/use-error-toast';

import { ThirdPartyFilters } from './components/third-party-filters';
import { ThirdPartyTable } from './components/third-party-table';

const routeApi = getRouteApi('/_authenticated/dashboard_/storeknox/third-party-scans/');

/**
 * The popular third-party apps in the stores and regions the organization opted into, with each
 * one's risk score and status.
 *
 * Every filter and the page live in the URL (`tp_store`, `tp_region`, `tp_risk_status`, `tp_filter`,
 * `tp_limit`, `tp_offset`), so the list can be linked to and survives back and forward; changing a
 * filter returns to the first page, and changing the store drops the region so the new store's
 * first one is chosen. With no opted region there is nothing to list and no request is sent.
 */
export function ThirdPartyScansPage() {
  const search = routeApi.useSearch();
  const navigate = useNavigate();

  const { data: config } = useQuery(skThirdPartyConfigOptions());
  const hasScope = hasThirdPartyScope(config);

  const { store, region } = resolveThirdPartyScope(config, {
    store: search.tp_store,
    region: search.tp_region,
  });

  const limit = search.tp_limit ?? 10;
  const offset = search.tp_offset ?? 0;
  const riskStatus = search.tp_risk_status ?? -1;
  const riskLabel = riskStatusLabel(riskStatus);

  const params: ApiSkThirdPartyAppsRequest = {
    store,
    region,
    limit,
    offset,
    ...(search.tp_filter && { filter: search.tp_filter }),
    ...(riskLabel && { risk_status: riskLabel }),
  };

  const apps = useQuery(skThirdPartyAppsOptions(params, { enabled: hasScope }));

  useErrorToast(apps.error);

  const totalCount = apps.data?.count ?? 0;
  const hasNoApps = !hasScope || (apps.isSuccess && totalCount === 0);

  /* A change to the filters starts again from the first page. */
  const refine = useCallback(
    (changes: Partial<ThirdPartyListSearch>) =>
      navigate({
        to: '.',
        search: (previous) => ({ ...previous, ...changes, tp_offset: undefined }),
      }),
    [navigate]
  );

  const searchFor = useCallback(
    (query: string) => refine({ tp_filter: query || undefined }),
    [refine]
  );

  const goToPage = ({ limit: nextLimit, offset: nextOffset }: AkPaginationPage) =>
    navigate({
      to: '.',
      search: (previous) => ({
        ...previous,
        tp_limit: nextLimit,
        tp_offset: nextOffset || undefined,
      }),
    });

  const renderContent = () => {
    if (hasNoApps) {
      return <SkListEmpty header={akMT('noDataAvailable')} />;
    }

    if (apps.isError) {
      return <SkListEmpty header={akMT('somethingWentWrong')} />;
    }

    return (
      <ThirdPartyTable
        apps={apps.data?.items}
        totalCount={totalCount}
        limit={limit}
        offset={offset}
        region={region}
        listSearch={search}
        isRefreshing={apps.isPlaceholderData}
        onPageChange={goToPage}
      />
    );
  };

  return (
    <PageWrapper contentWidth="standard" data-test-sk-third-party-scans>
      <div className="my-2.5 flex flex-col border border-border bg-background">
        <div className="flex items-center justify-between gap-4 p-5">
          <div className="flex flex-col gap-1">
            <AkTypography tag="h1" variant="subtitle1">
              <AkMessageTranslate id="storeknox.thirdPartyScansTitle" />
            </AkTypography>

            <AkTypography variant="body2" color="neutral">
              <AkMessageTranslate id="storeknox.thirdPartyScansDescription" />
            </AkTypography>
          </div>

          <ListingSearch query={search.tp_filter ?? ''} onSearch={searchFor} />
        </div>

        <AkDivider color="dark" />

        {config && hasScope ? (
          <ThirdPartyFilters
            config={config}
            store={store}
            region={region}
            riskStatus={riskStatus}
            onStoreChange={(next) => refine({ tp_store: next, tp_region: undefined })}
            onRegionChange={(next) => refine({ tp_region: next })}
            onRiskStatusChange={(next) =>
              refine({ tp_risk_status: next === -1 ? undefined : next })
            }
          />
        ) : null}
      </div>

      {renderContent()}
    </PageWrapper>
  );
}
