import { createFileRoute, redirect } from '@tanstack/react-router';

import { organizationStore } from '@irene/api/stores/organization';
import { akMT } from '@irene/translations/intl';
import { setupUserAndOrgContext } from '@/actions/setup-user-context';
import { SubscriptionPage } from '@/features/billing/pages/subscription';

export const Route = createFileRoute('/_authenticated/dashboard/subscription')({
  staticData: { pageTitle: () => akMT('subscription') },

  /*
    Only an owner whose organization shows its subscription may see the page;
    anyone else is sent to the projects, as irene's route sends them.

    `setupUserAndOrgContext` is awaited here rather than left to the parent's
    loader, which runs after every guard: the decision reads `organizationStore`,
    and the loader is what fills it. Its queries are cached, so the parent's own
    call costs nothing.
  */
  beforeLoad: async ({ context }) => {
    await setupUserAndOrgContext(context.queryClient, context.session.userId);

    const organization = organizationStore.getState();

    if (!organization.showsSubscription() || !organization.me?.is_owner) {
      throw redirect({ to: '/dashboard/projects', replace: true });
    }
  },

  component: SubscriptionPage,
});
