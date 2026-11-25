import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { OrganizationServiceAccountDetailsPage } from '@/features/organization';
import { ORGANIZATION_SETTINGS_TABS } from '@/features/organization/layout/settings-tabs';

/*
  One service account, which the list and the create screen both lead to.

  A page of its own, outside the settings tabs, as irene routes it.
*/
export const Route = createFileRoute(
  '/_authenticated/dashboard/organization_/settings_/service-account/$serviceAccountId'
)({
  staticData: {
    pageTitle: () => akMT('serviceAccountModule.detailsPageTitle'),

    breadcrumb: () => ({
      title: akMT('viewOrEdit'),
      parent: ORGANIZATION_SETTINGS_TABS.serviceAccount,
    }),
  },

  component: function ServiceAccountDetails() {
    const { serviceAccountId } = Route.useParams();

    return <OrganizationServiceAccountDetailsPage serviceAccountId={Number(serviceAccountId)} />;
  },
});
