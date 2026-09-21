import { faker } from '@faker-js/faker';
import type { ApiUser } from '@irene/api/services/user';

export const buildUser = (overrides: Partial<ApiUser> = {}): ApiUser => ({
  id: faker.number.int({ min: 1, max: 9999 }),
  uuid: faker.string.uuid(),
  username: faker.internet.username(),
  email: faker.internet.email(),
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
  lang: 'en',
  is_trial: false,
  mfa_method: null,
  can_disable_mfa: true,
  freshchat_hash: faker.string.alphanumeric(32),
  ...overrides,
});
