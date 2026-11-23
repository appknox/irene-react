import { createFileRoute, redirect } from '@tanstack/react-router';

import { organizationStore } from '@irene/api/stores/organization';
import { akMT } from '@irene/translations/intl';

import { setupUserAndOrgContext } from '@/actions/setup-user-context';
import { InventoryPendingReviewsPage } from '@/features/storeknox/pages/inventory-pending-reviews';
import { skAppListSearchSchema } from '@/features/storeknox/utils/list-params';

export const Route = createFileRoute(
  '/_authenticated/dashboard_/storeknox/inventory/pending-reviews'
)({
  staticData: { pageTitle: () => akMT('storeknox.pendingReview') },
  validateSearch: skAppListSearchSchema,

  /*
    Only an owner reviews apps, so anyone else is sent to the inventory. The guard awaits the
    organization setup itself, since the parent's loader fills the store only after every guard.
  */
  beforeLoad: async ({ context }) => {
    await setupUserAndOrgContext(context.queryClient, context.session.userId);

    if (!organizationStore.getState().isOwner()) {
      throw redirect({ to: '/dashboard/storeknox/inventory/app-list', replace: true });
    }
  },

  component: InventoryPendingReviewsPage,
});
