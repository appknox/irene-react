import { faker } from '@faker-js/faker';
import type { ApiSsoCheck } from '@irene/api/services/auth';

/** An SSO check result, password-only unless a flag is overridden. */
export const buildSsoCheck = (overrides: Partial<ApiSsoCheck> = {}): ApiSsoCheck => ({
  is_saml: false,
  is_sso_enforced: false,
  is_oidc: false,
  token: faker.string.alphanumeric(32),
  ...overrides,
});
