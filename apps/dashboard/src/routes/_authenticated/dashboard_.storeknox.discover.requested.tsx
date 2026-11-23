import { createFileRoute, redirect } from '@tanstack/react-router';

import { organizationStore } from '@irene/api/stores/organization';
import { akMT } from '@irene/translations/intl';

import { setupUserAndOrgContext } from '@/actions/setup-user-context';
import { DiscoverRequestedPage } from '@/features/storeknox/pages/discover-requested';
import { skAppListSearchSchema } from '@/features/storeknox/utils/list-params';

export const Route = createFileRoute('/_authenticated/dashboard_/storeknox/discover/requested')({
  staticData: { pageTitle: () => akMT('storeknox.requestedApps') },
  validateSearch: skAppListSearchSchema,

  /*
    An owner has no requests, so is sent to the search. The guard awaits the organization setup
    itself, since the parent's loader fills the store only after every guard.
  */
  beforeLoad: async ({ context }) => {
    await setupUserAndOrgContext(context.queryClient, context.session.userId);

    if (organizationStore.getState().isOwner()) {
      throw redirect({ to: '/dashboard/storeknox/discover/result', replace: true });
    }
  },

  component: DiscoverRequestedPage,
});
