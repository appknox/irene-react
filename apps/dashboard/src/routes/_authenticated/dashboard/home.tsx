import { createFileRoute, redirect } from '@tanstack/react-router';

import { organizationStore } from '@irene/api/stores/organization';
import { akMT } from '@irene/translations/intl';
import { setupUserAndOrgContext } from '@/actions/setup-user-context';
import { HomePage } from '@/features/dashboard/pages/home';

export const Route = createFileRoute('/_authenticated/dashboard/home')({
  staticData: { pageTitle: () => akMT('home') },

  /*
    The page shows one card per product the account may open, and every account
    has Appknox. An account entitled to neither StoreKnox nor the security
    dashboard is sent into `/dashboard/projects` rather than shown the page,
    since those two are what the guard reads for a second product.

    `setupUserAndOrgContext` is awaited here rather than left to the parent's
    loader, which runs after every guard: the decision reads `organizationStore`,
    and the loader is what fills it. The queries behind it are cached, so the
    parent's own call costs nothing.
  */
  beforeLoad: async ({ context }) => {
    await setupUserAndOrgContext(context.queryClient, context.session.userId);

    const { selected, me } = organizationStore.getState();
    const securityDashboardEnabled = me?.has_security_permission;
    const storeKnoxEnabled = selected?.features.storeknox;

    if (!securityDashboardEnabled && !storeKnoxEnabled) {
      throw redirect({ to: '/dashboard/projects', replace: true });
    }
  },

  component: HomePage,
});
