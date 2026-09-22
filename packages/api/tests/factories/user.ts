import { faker } from '@faker-js/faker';
import type { ApiUser, ApiUserResponse } from '@irene/api/services/user';

export const buildUser = (overrides: Partial<ApiUser> = {}): ApiUser => ({
  id: faker.number.int({ min: 1, max: 9999 }),
  uuid: faker.string.uuid(),
  username: faker.internet.username(),
  email: faker.internet.email(),
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
  lang: 'en',
  is_trial: false,
  mfa_method: 0,
  can_disable_mfa: true,
  freshchat_hash: faker.string.alphanumeric(32),
  ...overrides,
});

/** The account as the endpoint sends it: an envelope of kebab-case attributes. */
export const buildUserResponse = (overrides: Partial<ApiUser> = {}): ApiUserResponse => {
  const user = buildUser(overrides);

  return {
    data: {
      id: user.id,
      type: 'users',
      attributes: {
        uuid: user.uuid,
        username: user.username,
        'first-name': user.first_name,
        'last-name': user.last_name,
        lang: user.lang,
        email: user.email ?? undefined,
        'mfa-method': user.mfa_method ?? undefined,
        'is-trial': user.is_trial,
        'can-disable-mfa': user.can_disable_mfa,
        'freshchat-hash': user.freshchat_hash ?? undefined,
      },
    },
  };
};
