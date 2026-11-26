import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { OrganizationSettingsPage } from '@/features/organization';

/* The settings themselves, which the wrapper draws around as it does each tab. */
export const Route = createFileRoute('/_authenticated/dashboard/organization_/settings/')({
  staticData: { pageTitle: () => akMT('settings') },
  component: OrganizationSettingsPage,
});
