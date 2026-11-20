import { createFileRoute, redirect } from '@tanstack/react-router';

import { organizationStore } from '@irene/api/stores/organization';
import { akMT } from '@irene/translations/intl';
import { setupUserAndOrgContext } from '@/actions/setup-user-context';
import { StoreknoxLayout } from '@/layouts/storeknox-layout';

/* Store monitoring is its own product, so it renders its own layout rather than the dashboard's. */
export const Route = createFileRoute('/_authenticated/dashboard_/storeknox')({
  staticData: { pageTitle: () => akMT('storeknox.title') },

  /*
    An organization without StoreKnox is sent to its projects. The guard awaits the organization
    setup itself, since the parent's loader fills the store only after every guard.
  */
  beforeLoad: async ({ context }) => {
    await setupUserAndOrgContext(context.queryClient, context.session.userId);

    if (!organizationStore.getState().features().storeknox) {
      throw redirect({ to: '/dashboard/projects', replace: true });
    }
  },

  component: StoreknoxLayout,
});
