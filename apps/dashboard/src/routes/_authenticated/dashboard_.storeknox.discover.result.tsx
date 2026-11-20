import { createFileRoute, redirect } from '@tanstack/react-router';

import { StoreknoxService } from '@irene/api/services/storeknox';
import { unlessRateLimited } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { akNotify } from '@irene/ui/notify';

import { DiscoverResultsPage } from '@/features/storeknox/pages/discover-results';
import { skDiscoveryResultsSearchSchema } from '@/features/storeknox/utils/discovery';
import { skErrorMessage } from '@/features/storeknox/utils/error-message';

export const Route = createFileRoute('/_authenticated/dashboard_/storeknox/discover/result')({
  staticData: { pageTitle: () => akMT('storeknox.discoveryResults') },
  validateSearch: skDiscoveryResultsSearchSchema,

  /*
    A query without a search id is started on the server, and its id replaces the URL so the results
    are read by it. A preload never starts one, since starting posts.
  */
  beforeLoad: async ({ search, preload }) => {
    if (preload || !search.app_query || search.app_search_id) {
      return;
    }

    let searchId: number;

    try {
      searchId = (await StoreknoxService.createDiscoverySearch(search.app_query)).id;
    } catch (error) {
      unlessRateLimited((cause) => akNotify.error(skErrorMessage(cause)))(error);

      return;
    }

    throw redirect({
      to: '/dashboard/storeknox/discover/result',
      search: { ...search, app_search_id: searchId },
      replace: true,
    });
  },

  component: DiscoverResultsPage,
});
