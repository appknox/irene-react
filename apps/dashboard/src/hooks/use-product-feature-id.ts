import { useRouterState } from '@tanstack/react-router';

import {
  getProductFeatureIdForPath,
  type ProductFeatureId,
} from '@/features/dashboard/utils/product-features';

/**
 * The product the page being shown belongs to.
 *
 * Several products are reached from the same screens and differ in what those
 * screens offer, so this is read wherever that difference matters. It follows
 * the router, so moving between products re-renders whoever read it.
 *
 * @returns The product of the current page.
 */
export function useProductFeatureId(): ProductFeatureId {
  return useRouterState({ select: (state) => getProductFeatureIdForPath(state.location.pathname) });
}
