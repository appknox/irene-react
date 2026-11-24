import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { ORGANIZATION_TABS } from '@/features/organization/layout/tabs';
import { OrganizationSettingsWrapper } from '@/features/organization';

/*
  The organization's settings, which its own tabs render inside.

  It names itself and the organization above it, which is the trail irene's
  controller declares here, and the tabs under it name themselves.
*/
export const Route = createFileRoute('/_authenticated/dashboard/organization_/settings')({
  staticData: {
    pageTitle: () => akMT('settings'),

    breadcrumb: () => ({
      title: akMT('settings'),
      parent: { title: akMT('organization'), to: ORGANIZATION_TABS.users },
    }),
  },

  component: OrganizationSettingsWrapper,
});
