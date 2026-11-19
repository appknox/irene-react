import { faker } from '@faker-js/faker';
import type { ApiVaNotificationPreference } from '@irene/api/services/notification-preference';

/** The four scan-result preferences, each on or off at random unless pinned. */
export const buildVaNotificationPreference = (
  overrides: Partial<ApiVaNotificationPreference> = {}
): ApiVaNotificationPreference => ({
  all_va_completed: faker.datatype.boolean(),
  static_scan_completed: faker.datatype.boolean(),
  dynamic_scan_completed: faker.datatype.boolean(),
  api_scan_completed: faker.datatype.boolean(),
  ...overrides,
});
