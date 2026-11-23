import { useQuery } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { createContext, useContext } from 'react';

import { skInventoryAppOptions } from '@/features/storeknox/queries/inventory';
import type { ApiSkInventoryApp } from '@irene/api/services/storeknox';

const routeApi = getRouteApi('/_authenticated/dashboard_/storeknox/inventory-details/$id');

/**
 * The app for the `$id` in the URL, for the details layout; it stays a query so a
 * reload after an action reaches every page, and pages beneath read `useInventoryApp`.
 *
 * @returns Undefined only if the loader's request has been cleared.
 */
export function useInventoryAppQuery() {
  const { id } = routeApi.useParams();

  return useQuery(skInventoryAppOptions(id)).data;
}

/** Holds the app the details layout has read, for the pages beneath it. */
export const InventoryAppContext = createContext<ApiSkInventoryApp | null>(null);

/** The app the details page on screen is about, as the details layout provides it. */
export function useInventoryApp() {
  const app = useContext(InventoryAppContext);

  if (!app) {
    throw new Error('useInventoryApp is read outside the inventory details layout');
  }

  return app;
}
