import { z } from 'zod';

import { ENUMS } from '@irene/enums';
import type { ApiSkMonitoringStatusFilter } from '@irene/api/services/storeknox';
import type { SkAppListPage, SkInventoryListParams } from '@/features/storeknox/queries/inventory';

/* The filters a monitoring-status value may be; `-1` is irene's "every state". */
const MONITORING_FILTERS: ReadonlyArray<ApiSkMonitoringStatusFilter | -1> = [
  -1,
  ...ENUMS.SK_APP_MONITORING_STATUS_FILTER.BASE_VALUES,
];

const _isMonitoringFilter = (value: number): value is ApiSkMonitoringStatusFilter | -1 =>
  MONITORING_FILTERS.includes(value as ApiSkMonitoringStatusFilter | -1);

/** An inventory list's page params, under irene's names so an irene link lands on the same page. */
export const skAppListSearchSchema = z.object({
  app_limit: z.coerce.number().int().positive().optional().catch(undefined),
  app_offset: z.coerce.number().int().nonnegative().optional().catch(undefined),
});

/** The app list's search params: its page and its monitoring-status filter. */
export const skInventoryListSearchSchema = skAppListSearchSchema.extend({
  monitoring_status: z.coerce
    .number()
    .int()
    .refine(_isMonitoringFilter)
    .optional()
    .catch(undefined),
});

/** The search params an inventory list may carry, before defaults. */
export type SkAppListSearch = z.infer<typeof skInventoryListSearchSchema>;

/** The page a list's search params ask for, defaulting to irene's ten rows from the first. */
export const readListPage = (search: Partial<SkAppListSearch>): SkAppListPage => ({
  limit: search.app_limit ?? 10,
  offset: search.app_offset ?? 0,
});

/** The inventory list's page and monitoring filter; no filter reads as `-1`, every state. */
export function readInventoryListParams(search: Partial<SkAppListSearch>): SkInventoryListParams {
  const status = search.monitoring_status;

  return {
    ...readListPage(search),
    monitoringStatus: status !== undefined && _isMonitoringFilter(status) ? status : -1,
  };
}
