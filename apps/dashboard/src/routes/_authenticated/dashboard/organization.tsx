import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { OrganizationLayout } from '@/features/organization';

/*
  The organization's own screen, which its tabs render inside.

  It names the page, so a tab reads out through it — "Users | Organization" —
  as irene's nested routes name theirs.
*/
export const Route = createFileRoute('/_authenticated/dashboard/organization')({
  staticData: { pageTitle: () => akMT('organization') },
  component: OrganizationLayout,
});
