import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { SecuritySettingsPage } from '@/features/account-settings/pages/security';

export const Route = createFileRoute('/_authenticated/dashboard/settings/security')({
  staticData: { pageTitle: () => akMT('securitySettings') },
  component: SecuritySettingsPage,
});
