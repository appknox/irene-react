import { faker } from '@faker-js/faker';
import type { SsoCheck } from '@irene/api/types/sso';

export const buildSsoCheck = (overrides: Partial<SsoCheck> = {}): SsoCheck => ({
  is_saml: false,
  is_sso_enforced: false,
  is_oidc: false,
  token: faker.string.alphanumeric(32),
  ...overrides,
});
