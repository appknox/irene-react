import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { InventoryAppListPage } from '@/features/storeknox/pages/inventory-app-list';
import { skInventoryListSearchSchema } from '@/features/storeknox/utils/list-params';

export const Route = createFileRoute('/_authenticated/dashboard_/storeknox/inventory/app-list')({
  staticData: { pageTitle: () => akMT('storeknox.inventory') },
  validateSearch: skInventoryListSearchSchema,
  component: InventoryAppListPage,
});
