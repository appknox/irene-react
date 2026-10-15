import { faker } from '@faker-js/faker';
import type { ApiMfa, ApiMfaSetupToken } from '@irene/api/services/mfa';

/** One second-factor method, off unless the test turns it on. */
export const buildMfa = (overrides: Partial<ApiMfa> = {}): ApiMfa => ({
  method: faker.helpers.arrayElement([1, 2] as const),
  enabled: false,
  ...overrides,
});

/** What a step starting a setup hands back. */
export const buildMfaSetupToken = (
  overrides: Partial<ApiMfaSetupToken> = {}
): ApiMfaSetupToken => ({
  secret: faker.string.alphanumeric({ length: 32, casing: 'upper' }),
  token: faker.string.alphanumeric(64),
  ...overrides,
});
