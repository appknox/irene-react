import { useMatchRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { storeMonitoringNeedsAction } from '@/features/storeknox/utils/sk-app';
import type { ApiSkInventoryApp } from '@irene/api/services/storeknox';

/**
 * The section open beneath an app's details, read from the route, with what the header's tag shows for it.
 *
 * @returns Undefined on the details page itself.
 */
export function useActiveDetailsSection(app: ApiSkInventoryApp) {
  const matchRoute = useMatchRoute();
  const params = { id: String(app.id) };

  if (matchRoute({ to: '/dashboard/storeknox/inventory-details/$id/brand-abuse', params })) {
    return { label: akMT('storeknox.brandAbuse'), featureInProgress: true, needsAction: false };
  }

  if (matchRoute({ to: '/dashboard/storeknox/inventory-details/$id/malware-detected', params })) {
    return {
      label: akMT('storeknox.malwareDetected'),
      featureInProgress: true,
      needsAction: false,
    };
  }

  if (
    matchRoute({
      to: '/dashboard/storeknox/inventory-details/$id/unscanned-version',
      params,
      fuzzy: true,
    })
  ) {
    return {
      label: akMT('storeknox.unscannedVersion'),
      featureInProgress: false,
      needsAction: storeMonitoringNeedsAction(app),
    };
  }

  return undefined;
}
