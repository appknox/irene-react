import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';

import {
  skThirdPartyAppOptions,
  skThirdPartyConfigOptions,
} from '@/features/storeknox/queries/third-party';

import {
  resolveThirdPartyScope,
  thirdPartyDetailsSearchSchema,
} from '@/features/storeknox/utils/third-party';

import { RouteError } from '@/components/route-error';
import { ThirdPartyScanDetailsPage } from '@/features/storeknox/pages/third-party-scan-details';
import { DetailsSkeleton } from '@/features/storeknox/pages/third-party-scan-details/components/details-skeleton';

/*
  One app's risk assessment, inside the guarded `third-party-scans` layout. The loader resolves the
  store and region from the config as the page does, so the app it warms is the one the page reads;
  a failed config or app fetch renders the route error, as irene's route model would fail.
*/
export const Route = createFileRoute(
  '/_authenticated/dashboard_/storeknox/third-party-scans/$packageName'
)({
  staticData: { pageTitle: () => akMT('storeknox.thirdPartyScansTitle') },
  validateSearch: thirdPartyDetailsSearchSchema,

  loaderDeps: ({ search }) => ({
    store: search.tp_store,
    region: search.tp_region,
    version: search.tp_version,
  }),

  loader: async ({ context, params, deps }) => {
    const config = await context.queryClient.query(skThirdPartyConfigOptions());
    const { store, region } = resolveThirdPartyScope(config, deps);

    await context.queryClient.query(
      skThirdPartyAppOptions({ q: params.packageName, store, region, version: deps.version })
    );
  },

  pendingComponent: DetailsSkeleton,
  errorComponent: RouteError,
  component: ThirdPartyScanDetailsPage,
});
