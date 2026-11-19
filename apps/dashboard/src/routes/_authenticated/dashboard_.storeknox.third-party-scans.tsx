import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { storeknoxOrganizationOptions } from '@/queries/organization';

/* Third-party app risk assessment is a StoreKnox feature the organization has to be licensed for. */
export const Route = createFileRoute('/_authenticated/dashboard_/storeknox/third-party-scans')({
  staticData: { pageTitle: () => akMT('storeknox.thirdPartyScansTitle') },

  /*
    An organization without third-party scanning is sent to its inventory; irene has no such
    guard. The StoreKnox organization failing to load reads as no feature, as the fake-apps
    guard does. The parent route already guards StoreKnox itself.
  */
  beforeLoad: async ({ context }) => {
    const storeknoxOrganization = await context.queryClient
      .ensureQueryData(storeknoxOrganizationOptions())
      .catch(() => undefined);

    if (!storeknoxOrganization?.sk_features.third_party_scanning) {
      throw redirect({ to: '/dashboard/storeknox/inventory/app-list', replace: true });
    }
  },

  component: Outlet,
});
