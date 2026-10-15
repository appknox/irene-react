import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { GeneralSettingsPage } from '@/features/account-settings/pages/general';

export const Route = createFileRoute('/_authenticated/dashboard/settings/general')({
  staticData: { pageTitle: () => akMT('generalSettings') },
  component: GeneralSettingsPage,
});
