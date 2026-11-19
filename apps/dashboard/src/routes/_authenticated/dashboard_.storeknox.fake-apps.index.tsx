import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { FakeAppsListingPage } from '@/features/storeknox/pages/fake-apps';
import { skFakeAppInventorySearchSchema } from '@/features/storeknox/utils/list-params';

export const Route = createFileRoute('/_authenticated/dashboard_/storeknox/fake-apps/')({
  staticData: { pageTitle: () => akMT('storeknox.fakeAppsTitle') },
  validateSearch: skFakeAppInventorySearchSchema,
  component: FakeAppsListingPage,
});
