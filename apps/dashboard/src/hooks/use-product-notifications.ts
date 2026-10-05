import { useRouterState } from '@tanstack/react-router';

import { getProductFeatureIdForPath } from '@/features/dashboard/utils/product-features';
import type { ApiNotificationProduct } from '@irene/api/services/notification';

/**
 * Whose notifications the bell reads: the product the page being shown belongs to.
 *
 * Each product keeps notifications of its own, so switching to store
 * monitoring is meant to switch what the bell reports. Anything that is not a
 * product of its own counts as Appknox, which is where those notifications are.
 *
 * @returns The product to read notifications for.
 */
export function useProductNotifications(): ApiNotificationProduct {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const product = getProductFeatureIdForPath(pathname);

  return product === 'storeknox' ? 'storeknox' : 'appknox';
}
