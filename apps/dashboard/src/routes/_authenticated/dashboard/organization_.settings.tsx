import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { OrganizationSettingsWrapper } from '@/features/organization';
import { ORGANIZATION_TABS } from '@/features/organization/layout/tabs';

/*
  The organization's settings, which its own tabs render inside.

  It names itself and the organization above it, which is the trail irene's
  controller declares here, and the tabs under it name themselves.
*/
export const Route = createFileRoute('/_authenticated/dashboard/organization_/settings')({
  staticData: {
    pageTitle: () => akMT('settings'),

    breadcrumb: () => ({ title: akMT('settings'), parent: ORGANIZATION_TABS.users }),
  },

  component: OrganizationSettingsWrapper,
});
