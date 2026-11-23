import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { InventoryLayout } from '@/features/storeknox/pages/inventory';
import { InventorySkeleton } from '@/features/storeknox/pages/inventory/components/inventory-skeleton';

/* The inventory's heading and tabs, around whichever list is open. */
export const Route = createFileRoute('/_authenticated/dashboard_/storeknox/inventory')({
  staticData: { pageTitle: () => akMT('storeknox.inventory') },
  component: InventoryLayout,

  /* Only the component is split out, so this placeholder ships in the calling bundle and shows while it loads. */
  pendingComponent: InventorySkeleton,
  pendingMs: 150,
  pendingMinMs: 300,
});
