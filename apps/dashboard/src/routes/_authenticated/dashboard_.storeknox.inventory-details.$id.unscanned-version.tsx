import { createFileRoute, redirect } from '@tanstack/react-router';

import {
  isDecommissioned,
  storeMonitoringIsDisabled,
  storeMonitoringIsPending,
  storeMonitoringNeedsAction,
} from '@/features/storeknox/utils/sk-app';

import { akMT } from '@irene/translations/intl';
import { UnscannedVersionLayout } from '@/features/storeknox/pages/unscanned-version';
import { skInventoryAppOptions } from '@/features/storeknox/queries/inventory';

/* The StoreKnox new-version notification links here, so the URL is irene's. */
export const Route = createFileRoute(
  '/_authenticated/dashboard_/storeknox/inventory-details/$id/unscanned-version'
)({
  staticData: { pageTitle: () => akMT('storeknox.unscannedVersion') },

  /*
    Sent back to the app while monitoring gathers its first results, or when it is off with nothing to
    act on; a decommissioned app reports disabled but keeps its history viewable. The "needs action"
    check cannot hold for a disabled app but is kept, as irene has it. The guard fetches the app
    itself, since the parent's loader runs only after every guard.
  */
  beforeLoad: async ({ context, params }) => {
    const app = await context.queryClient.query(skInventoryAppOptions(params.id));
    const isDecommissionedWithHistory = isDecommissioned(app) && app.has_store_monitoring_data;

    if (
      storeMonitoringIsPending(app) ||
      (storeMonitoringIsDisabled(app) &&
        !storeMonitoringNeedsAction(app) &&
        !isDecommissionedWithHistory)
    ) {
      throw redirect({
        to: '/dashboard/storeknox/inventory-details/$id',
        params: { id: params.id },
        replace: true,
      });
    }
  },

  component: UnscannedVersionLayout,
});
