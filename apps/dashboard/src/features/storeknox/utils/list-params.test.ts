import { describe, expect, it } from 'vitest';

import { ENUMS } from '@irene/enums';

import { readInventoryListParams, readListPage, skInventoryListSearchSchema } from './list-params';

describe('list params', () => {
  it('starts a list at irene’s ten rows from the first', () => {
    expect(readListPage({})).toEqual({ limit: 10, offset: 0 });
  });

  it('reads the page and the monitoring filter from the search params', () => {
    const search = skInventoryListSearchSchema.parse({
      app_limit: '25',
      app_offset: '50',
      monitoring_status: String(ENUMS.SK_APP_MONITORING_STATUS_FILTER.DECOMMISSIONED),
    });

    expect(readInventoryListParams(search)).toEqual({
      limit: 25,
      offset: 50,
      monitoringStatus: ENUMS.SK_APP_MONITORING_STATUS_FILTER.DECOMMISSIONED,
    });
  });

  it('drops values that do not parse rather than failing the page', () => {
    const search = skInventoryListSearchSchema.parse({
      app_limit: 'many',
      monitoring_status: '42',
    });

    expect(readInventoryListParams(search)).toEqual({ limit: 10, offset: 0, monitoringStatus: -1 });
  });
});
