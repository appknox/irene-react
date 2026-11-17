import { createFileRoute, redirect } from '@tanstack/react-router';

import { organizationStore } from '@irene/api/stores/organization';
import { akMT } from '@irene/translations/intl';
import { setupUserAndOrgContext } from '@/actions/setup-user-context';
import { ReportLayout } from '@/layouts/report-layout';

/* Reporting is its own product, so it renders its own layout rather than the dashboard's. */
export const Route = createFileRoute('/_authenticated/dashboard_/reports')({
  staticData: { pageTitle: () => akMT('reportModule.title') },

  /*
    An organization without AI reporting is sent home, as irene's reports route
    sends it. The organization context is awaited here because the parent's
    loader, which fills the store, runs after every guard; it is cached.
  */
  beforeLoad: async ({ context }) => {
    await setupUserAndOrgContext(context.queryClient, context.session.userId);

    if (!organizationStore.getState().aiFeatures().reporting) {
      throw redirect({ to: '/', replace: true });
    }
  },

  component: ReportLayout,
});
