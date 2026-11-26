import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { InventoryDetailsAppPage } from '@/features/storeknox/pages/inventory-details-app';

export const Route = createFileRoute('/_authenticated/dashboard_/storeknox/inventory-details/$id/')(
  {
    staticData: { pageTitle: () => akMT('storeknox.inventoryDetails') },
    component: InventoryDetailsAppPage,
  }
);
