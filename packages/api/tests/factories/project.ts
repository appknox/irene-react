import { faker } from '@faker-js/faker';
import type { Project } from '@irene/api/types/project';

export const buildProject = (overrides: Partial<Project> = {}): Project => ({
  id: faker.number.int({ min: 1, max: 9999 }),
  package_name: faker.internet.domainName(),
  url: faker.internet.url(),
  platform: faker.number.int({ min: 0, max: 4 }),
  file_count: faker.number.int({ min: 0, max: 50 }),
  active_profile_id: faker.number.int({ min: 1, max: 999 }),
  is_manual_scan_available: faker.datatype.boolean(),
  show_unknown_analysis: faker.datatype.boolean(),
  last_file_created_on: faker.date.recent().toISOString(),
  ...overrides,
});
