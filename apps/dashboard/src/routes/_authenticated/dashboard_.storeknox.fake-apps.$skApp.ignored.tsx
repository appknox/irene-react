import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { FakeAppTabPage } from '@/features/storeknox/pages/fake-app-list';
import { skFakeAppTabSearchSchema } from '@/features/storeknox/utils/list-params';

export const Route = createFileRoute(
  '/_authenticated/dashboard_/storeknox/fake-apps/$skApp/ignored'
)({
  staticData: { pageTitle: () => akMT('storeknox.fakeApps.ignored') },
  validateSearch: skFakeAppTabSearchSchema,
  component: () => <FakeAppTabPage tab="ignored" />,
});
