import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { NotificationSettingsPage } from '@/features/account-settings/pages/notification-settings';

export const Route = createFileRoute('/_authenticated/dashboard/settings/notification-settings')({
  staticData: { pageTitle: () => akMT('notificationPreferences') },
  component: NotificationSettingsPage,
});
