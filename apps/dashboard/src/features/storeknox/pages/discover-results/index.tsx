import { getRouteApi, useNavigate, useRouterState } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import StoreknoxSearchApps from '@irene/ui/svgs/storeknox-search-apps.svg?react';

import { SkListEmpty } from '@/features/storeknox/components/list-empty';
import { readListPage } from '@/features/storeknox/utils/list-params';

import { Disclaimer } from './components/disclaimer';
import { ResultsTable } from './components/results-table';
import { SearchForm } from './components/search-form';

const routeApi = getRouteApi('/_authenticated/dashboard_/storeknox/discover/result');

/**
 * The store search page. A search enters the URL without an id; the route starts it on the server
 * and adds the id, which the results are read by.
 */
export function DiscoverResultsPage() {
  const search = routeApi.useSearch();
  const navigate = useNavigate();

  const page = readListPage(search);
  const query = search.app_query ?? '';
  const searchId = search.app_search_id;

  /* The route starts a search in its `beforeLoad`, so the button spins until the router has the search's id. */
  const isStartingSearch = useRouterState({
    select: (state) =>
      state.isLoading &&
      Boolean(state.location.search.app_query) &&
      !state.location.search.app_search_id,
  });

  return (
    <div className="flex flex-col" data-test-sk-discovery-results-page>
      {/* Keyed on the query, so the field shows the search the page is showing. */}
      <SearchForm
        key={query}
        initialQuery={query}
        isSearching={isStartingSearch}
        onSearch={(nextQuery) =>
          navigate({
            to: '.',
            search: { ...search, app_offset: 0, app_query: nextQuery, app_search_id: undefined },
          })
        }
      />

      <Disclaimer />

      {query && searchId ? (
        <ResultsTable
          query={query}
          searchId={String(searchId)}
          page={page}
          onPageChange={({ limit, offset }) =>
            navigate({ to: '.', search: { ...search, app_limit: limit, app_offset: offset } })
          }
        />
      ) : (
        <SkListEmpty
          illustration={<StoreknoxSearchApps aria-hidden="true" />}
          header={akMT('storeknox.searchForApps')}
          subText={akMT('storeknox.searchForAppsDescription')}
        />
      )}
    </div>
  );
}
