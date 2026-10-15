import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { CyodSettingsPage } from '@/features/account-settings/pages/cyod-settings';

export const Route = createFileRoute('/_authenticated/dashboard/settings/cyod-settings')({
  staticData: { pageTitle: () => akMT('cyod.settings.tabLabel') },
  component: CyodSettingsPage,
});
