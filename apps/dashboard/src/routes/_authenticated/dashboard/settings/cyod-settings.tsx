import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { CyodSettingsPage } from '@/features/account-settings/pages/cyod-settings';
import { CyodSettingsSkeleton } from '@/features/account-settings/pages/cyod-settings/components/cyod-settings-skeleton';

export const Route = createFileRoute('/_authenticated/dashboard/settings/cyod-settings')({
  staticData: { pageTitle: () => akMT('cyod.settings.tabLabel') },
  component: CyodSettingsPage,

  /*
    The page is a chunk of its own, so a first visit waits on a request before
    anything of it exists. Only the component is split out, which leaves this
    placeholder in the bundle the tab is clicked from.
  */
  pendingComponent: CyodSettingsSkeleton,
  pendingMs: 150,
  pendingMinMs: 300,
});
