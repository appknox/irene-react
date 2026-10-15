import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { DeveloperSettingsPage } from '@/features/account-settings/pages/developer-settings';

export const Route = createFileRoute('/_authenticated/dashboard/settings/developersettings')({
  staticData: { pageTitle: () => akMT('developerSettings') },
  component: DeveloperSettingsPage,
});
