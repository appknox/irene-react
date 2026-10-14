import { faker } from '@faker-js/faker';

import { ENUMS } from '@irene/enums';

import type {
  ApiSubmission,
  ApiSubmissionAppData,
  ApiSubmissionStatus,
} from '@irene/api/services/submission';

export const buildSubmissionAppData = (
  overrides: Partial<ApiSubmissionAppData> = {}
): ApiSubmissionAppData => ({
  package_name: faker.internet.domainName(),
  platform: faker.helpers.arrayElement([0, 1, 2]),
  name: faker.commerce.productName(),
  version: faker.system.semver(),
  version_code: String(faker.number.int({ min: 1, max: 999 })),
  icon_url: faker.image.url(),
  store_name: faker.company.name(),
  country: faker.location.countryCode(),
  release_date: faker.date.past().toISOString(),
  ...overrides,
});

export const buildSubmission = (overrides: Partial<ApiSubmission> = {}): ApiSubmission => ({
  id: faker.number.int({ min: 1, max: 9999 }),
  file: faker.number.int({ min: 1, max: 9999 }),
  reason: '',
  status: faker.helpers.arrayElement(Object.values(ENUMS.SUBMISSION_STATUS)) as ApiSubmissionStatus,
  package_name: faker.internet.domainName(),
  url: '',
  source: ENUMS.SUBMISSION_SOURCE.UPLOAD,
  status_humanized: faker.word.words(2),
  created_on: faker.date.recent().toISOString(),
  app_data: buildSubmissionAppData(),
  ...overrides,
});
