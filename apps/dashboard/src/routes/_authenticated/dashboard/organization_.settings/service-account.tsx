import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { akMT } from '@irene/translations/intl';
import { OrganizationServiceAccountPage } from '@/features/organization';
import { ORGANIZATION_SETTINGS_TABS } from '@/features/organization/layout/settings-tabs';

/*
  The page and the two filters are kept in the address under the names irene's
  route gives them. `catch` keeps a hand-edited address from erroring the screen.
*/
const searchSchema = z.object({
  sa_limit: z.number().default(10).catch(10),
  sa_offset: z.number().default(0).catch(0),
  show_system_created: z.boolean().default(false).catch(false),
  show_cli_enabled: z.boolean().default(false).catch(false),
});

/* One tab of the organization's settings, which the wrapper draws around it. */
export const Route = createFileRoute(
  '/_authenticated/dashboard/organization_/settings/service-account'
)({
  staticData: {
    pageTitle: () => akMT('serviceAccount'),

    breadcrumb: () => ({
      title: akMT('serviceAccount'),
      parent: ORGANIZATION_SETTINGS_TABS.settings,
    }),
  },
  validateSearch: searchSchema,
  component: OrganizationServiceAccountPage,
});
