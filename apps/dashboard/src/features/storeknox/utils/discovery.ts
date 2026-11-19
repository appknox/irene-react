import { z } from 'zod';

import { skAppListSearchSchema } from '@/features/storeknox/utils/list-params';
import type { ApiSkDiscoveryResult } from '@irene/api/services/storeknox';
import type { SkCellApp } from '@/features/storeknox/components/table-cells';

/**
 * The discovery results' search params, under irene's names; a query with no
 * `app_search_id` is a search the route still has to start.
 */
export const skDiscoveryResultsSearchSchema = skAppListSearchSchema.extend({
  app_query: z.string().optional().catch(undefined),
  app_search_id: z.coerce.number().int().positive().optional().catch(undefined),
});

/** The discovery results' search params, before defaults. */
export type SkDiscoveryResultsSearch = z.infer<typeof skDiscoveryResultsSearchSchema>;

/** A search result in the shape the shared table cells read; with no inventory id, its row links nowhere. */
export const discoveryResultAsCellApp = (result: ApiSkDiscoveryResult): SkCellApp => ({
  app_metadata: {
    url: result.app_url,
    icon_url: result.icon_url,
    package_name: result.package_name,
    title: result.title,
    platform: result.platform,
    dev_name: result.dev_name,
    dev_email: result.dev_email,
  },
});
