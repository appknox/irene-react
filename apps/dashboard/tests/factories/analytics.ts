import { faker } from '@faker-js/faker';
import type { ApiAppScan, ApiRecentIssue, ApiScanCount } from '@irene/api/services/analytics';

/** What an organization's scanning adds up to. */
export const buildScanCount = (overrides: Partial<ApiScanCount> = {}): ApiScanCount => {
  const android = faker.number.int({ min: 1, max: 400 });
  const ios = faker.number.int({ min: 1, max: 400 });

  return {
    id: faker.number.int({ min: 1, max: 9999 }),
    total_scan_count: android + ios,
    total_android_scan_count: android,
    total_ios_scan_count: ios,
    static_scan_count: faker.number.int({ min: 0, max: 400 }),
    dynamic_scan_count: faker.number.int({ min: 0, max: 400 }),
    api_scan_count: faker.number.int({ min: 0, max: 400 }),
    manual_scan_count: faker.number.int({ min: 0, max: 400 }),
    ...overrides,
  };
};

/** One app's scans on one day, counted and typed the way the server sends them. */
export const buildAppScan = (overrides: Partial<ApiAppScan> = {}): ApiAppScan => ({
  created_on_date: faker.date.recent({ days: 20 }).toISOString(),
  file_count: String(faker.number.int({ min: 1, max: 9 })),
  package_name: faker.internet.domainName().split('.').reverse().join('.'),
  platform: '0',
  ...overrides,
});

/** How often one vulnerability was found. */
export const buildRecentIssue = (overrides: Partial<ApiRecentIssue> = {}): ApiRecentIssue => {
  const vulnerability = faker.number.int({ min: 1, max: 999 });

  return {
    id: vulnerability,
    vulnerability,
    count: faker.number.int({ min: 1, max: 50 }),
    ...overrides,
  };
};
