import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { AccountSettingsLayout } from '@/features/account-settings';

/* Every account settings page sits under the same tabs, so the tabs live on this layout route. */
export const Route = createFileRoute('/_authenticated/dashboard/settings')({
  staticData: { pageTitle: () => akMT('settings') },
  component: AccountSettingsLayout,
});
