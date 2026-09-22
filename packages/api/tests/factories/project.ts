import { faker } from '@faker-js/faker';
import type { ApiProject } from '@irene/api/services/project';

export const buildProject = (overrides: Partial<ApiProject> = {}): ApiProject => ({
  id: faker.number.int({ min: 1, max: 9999 }),
  uuid: faker.string.uuid(),
  organization: faker.number.int({ min: 1, max: 9999 }),
  package_name: faker.internet.domainName(),
  platform: faker.helpers.arrayElement([0, 1, 2] as const),
  file_count: faker.number.int({ min: 0, max: 50 }),
  active_profile_id: faker.number.int({ min: 1, max: 999 }),
  is_api_scan_enabled: faker.datatype.boolean(),
  is_manual_scan_available: faker.datatype.boolean(),
  show_unknown_analysis: faker.datatype.boolean(),
  created_on: faker.date.past().toISOString(),
  updated_on: faker.date.recent().toISOString(),
  last_file_created_on: faker.date.recent().toISOString(),
  ...overrides,
});
