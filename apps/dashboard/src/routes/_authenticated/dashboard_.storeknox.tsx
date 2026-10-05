import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { StoreknoxLayout } from '@/layouts/storeknox-layout';

/* Store monitoring is its own product, so it renders its own layout rather than the dashboard's. */
export const Route = createFileRoute('/_authenticated/dashboard_/storeknox')({
  staticData: { pageTitle: () => akMT('storeknox.title') },
  component: StoreknoxLayout,
});
