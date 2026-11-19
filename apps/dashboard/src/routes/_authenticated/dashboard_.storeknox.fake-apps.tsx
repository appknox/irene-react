import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { storeknoxOrganizationOptions } from '@/queries/organization';

/* Brand abuse and fake-app detection is a StoreKnox feature the organization has to be licensed for. */
export const Route = createFileRoute('/_authenticated/dashboard_/storeknox/fake-apps')({
  staticData: { pageTitle: () => akMT('storeknox.fakeAppsTitle') },

  /*
    An organization without fake-app detection is sent to its inventory. The StoreKnox organization
    failing to load reads as no feature, as irene's route does when it has no selected organization.
    The parent route already guards StoreKnox itself.
  */
  beforeLoad: async ({ context }) => {
    const storeknoxOrganization = await context.queryClient
      .ensureQueryData(storeknoxOrganizationOptions())
      .catch(() => undefined);

    if (!storeknoxOrganization?.sk_features.fake_app_detection) {
      throw redirect({ to: '/dashboard/storeknox/inventory/app-list', replace: true });
    }
  },

  component: Outlet,
});
