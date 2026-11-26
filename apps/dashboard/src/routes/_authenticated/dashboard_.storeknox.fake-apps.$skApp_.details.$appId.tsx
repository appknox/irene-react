import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';

import { RouteError } from '@/components/route-error';
import { FakeAppDetailsPage } from '@/features/storeknox/pages/fake-app-details';
import { DetailsSkeleton } from '@/features/storeknox/pages/fake-app-details/components/details-skeleton';
import { skFakeAppOptions } from '@/features/storeknox/queries/fake-apps';
import { skInventoryAppOptions } from '@/features/storeknox/queries/inventory';

/*
  One copy's details. The `$skApp_` segment keeps it out of the app's tab layout while it stays
  inside the access guard of the `fake-apps` layout. Both records load before the page renders,
  as irene's route model does.
*/
export const Route = createFileRoute(
  '/_authenticated/dashboard_/storeknox/fake-apps/$skApp_/details/$appId'
)({
  staticData: { pageTitle: () => akMT('storeknox.fakeAppDetails') },

  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.query(skInventoryAppOptions(params.skApp)),
      context.queryClient.query(skFakeAppOptions(params.skApp, params.appId)),
    ]),

  pendingComponent: DetailsSkeleton,
  errorComponent: RouteError,
  component: FakeAppDetailsPage,
});
