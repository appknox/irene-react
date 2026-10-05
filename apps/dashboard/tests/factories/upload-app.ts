import { faker } from '@faker-js/faker';
import type { ApiPresignedUpload, ApiUploadedApp } from '@irene/api/services/upload-app';

export const buildPresignedUpload = (
  overrides: Partial<ApiPresignedUpload> = {}
): ApiPresignedUpload => ({
  url: faker.internet.url(),
  file_key: faker.string.uuid(),
  file_key_signed: `${faker.string.uuid()}:${faker.string.alphanumeric(16)}`,
  ...overrides,
});

export const buildUploadedApp = (overrides: Partial<ApiUploadedApp> = {}): ApiUploadedApp => ({
  ...buildPresignedUpload(),
  submission_id: faker.number.int({ min: 1, max: 9999 }),
  ...overrides,
});
