import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { DiscoverLayout } from '@/features/storeknox/pages/discover';
import { DiscoverSkeleton } from '@/features/storeknox/pages/discover/components/discover-skeleton';

/* Discovery's heading and tabs, around whichever page is open. */
export const Route = createFileRoute('/_authenticated/dashboard_/storeknox/discover')({
  staticData: { pageTitle: () => akMT('storeknox.discoverHeader') },
  component: DiscoverLayout,

  /* Only the component is split out, so this placeholder ships in the calling bundle and shows while it loads. */
  pendingComponent: DiscoverSkeleton,
  pendingMs: 150,
  pendingMinMs: 300,
});
