import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';

import { RouteError } from '@/components/route-error';
import { RoutePending } from '@/components/route-pending';
import { FakeAppListLayout } from '@/features/storeknox/pages/fake-app-list';
import { skInventoryAppOptions } from '@/features/storeknox/queries/inventory';

/* One app's fake-app list; the app is fetched before the list renders, as irene's route model does. */
export const Route = createFileRoute('/_authenticated/dashboard_/storeknox/fake-apps/$skApp')({
  staticData: { pageTitle: () => akMT('storeknox.fakeAppDetails') },
  loader: ({ context, params }) => context.queryClient.query(skInventoryAppOptions(params.skApp)),
  pendingComponent: RoutePending,
  errorComponent: RouteError,
  component: FakeAppListLayout,
});
