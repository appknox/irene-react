import { createFileRoute, redirect } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';

import {
  hasThirdPartyScope,
  resolveThirdPartyScope,
  thirdPartyListSearchSchema,
} from '@/features/storeknox/utils/third-party';

import { RouteError } from '@/components/route-error';
import { RoutePending } from '@/components/route-pending';
import { ThirdPartyScansPage } from '@/features/storeknox/pages/third-party-scans';
import { skThirdPartyConfigOptions } from '@/features/storeknox/queries/third-party';

export const Route = createFileRoute('/_authenticated/dashboard_/storeknox/third-party-scans/')({
  staticData: { pageTitle: () => akMT('storeknox.thirdPartyScansTitle') },
  validateSearch: thirdPartyListSearchSchema,
  loaderDeps: ({ search }) => ({ store: search.tp_store, region: search.tp_region }),

  /*
    The store and region the list shows are written back to the URL, replacing the entry, so the
    address always names what is on screen; irene left it showing whatever was asked for. With no
    opted region there is nothing to resolve to and the URL is left as it is.
  */
  loader: async ({ context, deps }) => {
    const config = await context.queryClient.query(skThirdPartyConfigOptions());

    if (!hasThirdPartyScope(config)) {
      return;
    }

    const { store, region } = resolveThirdPartyScope(config, deps);

    if (store !== deps.store || region !== deps.region) {
      throw redirect({
        to: '/dashboard/storeknox/third-party-scans',
        search: (previous) => ({ ...previous, tp_store: store, tp_region: region }),
        replace: true,
      });
    }
  },

  pendingComponent: RoutePending,
  errorComponent: RouteError,
  component: ThirdPartyScansPage,
});
