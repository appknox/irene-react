import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { akMT } from '@irene/translations/intl';
import { OrganizationServiceAccountCreatePage } from '@/features/organization';
import { ORGANIZATION_SETTINGS_TABS } from '@/features/organization/layout/settings-tabs';

/*
  The screen a service account is made on.

  A page of its own rather than a tab: the trailing underscore keeps the URL
  under the settings but leaves that screen's chrome — the name header and the
  tabs — out of it, which is where irene puts this route too.
*/
export const Route = createFileRoute(
  '/_authenticated/dashboard/organization_/settings_/service-account/create'
)({
  staticData: {
    pageTitle: () => akMT('serviceAccountModule.createPageTitle'),

    breadcrumb: () => ({
      title: akMT('create'),
      parent: ORGANIZATION_SETTINGS_TABS.serviceAccount,
    }),
  },
  /* The account a new one is copied from, under the name irene's route gives it. */
  validateSearch: z.object({ duplicate: z.number().optional().catch(undefined) }),
  component: OrganizationServiceAccountCreatePage,
});
