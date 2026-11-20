import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';

import { RouteError } from '@/components/route-error';
import { RoutePending } from '@/components/route-pending';
import { InventoryDetailsLayout } from '@/features/storeknox/pages/inventory-details';
import { skInventoryAppOptions } from '@/features/storeknox/queries/inventory';

/* One app's details; the app is fetched before any page about it renders, as irene's model hook does. */
export const Route = createFileRoute('/_authenticated/dashboard_/storeknox/inventory-details/$id')({
  staticData: { pageTitle: () => akMT('storeknox.inventoryDetails') },
  loader: ({ context, params }) => context.queryClient.query(skInventoryAppOptions(params.id)),
  pendingComponent: RoutePending,
  errorComponent: RouteError,
  component: InventoryDetailsLayout,
});
