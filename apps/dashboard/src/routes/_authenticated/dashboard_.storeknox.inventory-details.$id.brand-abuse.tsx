import { createFileRoute, redirect } from '@tanstack/react-router';

import { organizationStore } from '@irene/api/stores/organization';
import { akMT } from '@irene/translations/intl';
import { setupUserAndOrgContext } from '@/actions/setup-user-context';
import { FeatureUnavailablePage } from '@/features/storeknox/pages/inventory-details-feature-unavailable';

export const Route = createFileRoute(
  '/_authenticated/dashboard_/storeknox/inventory-details/$id/brand-abuse'
)({
  staticData: { pageTitle: () => akMT('storeknox.brandAbuse') },

  /* An organization that hides what it has not bought is sent back to the app. */
  beforeLoad: async ({ context, params }) => {
    await setupUserAndOrgContext(context.queryClient, context.session.userId);

    if (organizationStore.getState().hidesUpsell()) {
      throw redirect({
        to: '/dashboard/storeknox/inventory-details/$id',
        params: { id: params.id },
        replace: true,
      });
    }
  },

  component: () => <FeatureUnavailablePage feature="brand-abuse" />,
});
