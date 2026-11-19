import { createFileRoute, redirect } from '@tanstack/react-router';

import { organizationStore } from '@irene/api/stores/organization';
import { akMT } from '@irene/translations/intl';

import { setupUserAndOrgContext } from '@/actions/setup-user-context';
import { ArchivedAppsPage } from '@/features/storeknox/pages/archived-apps';
import { skAppListSearchSchema } from '@/features/storeknox/utils/list-params';

/* irene serves the archived apps beside the inventory's tabs rather than under them. */
export const Route = createFileRoute(
  '/_authenticated/dashboard_/storeknox/inventory_/archived-apps'
)({
  staticData: { pageTitle: () => akMT('storeknox.archivedApps') },
  validateSearch: skAppListSearchSchema,

  /* Only owners and admins archive apps, so anyone else is sent to the inventory. */
  beforeLoad: async ({ context }) => {
    await setupUserAndOrgContext(context.queryClient, context.session.userId);

    const organization = organizationStore.getState();

    if (!organization.isOwner() && !organization.isAdmin()) {
      throw redirect({ to: '/dashboard/storeknox/inventory', replace: true });
    }
  },

  component: ArchivedAppsPage,
});
