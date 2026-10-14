import { faker } from '@faker-js/faker';

import type {
  ApiPersonalToken,
  ApiPersonalTokenResource,
} from '@irene/api/services/personal-token';

/** A token the account generated. */
export const buildPersonalToken = (
  overrides: Partial<ApiPersonalToken> = {}
): ApiPersonalToken => ({
  id: String(faker.number.int({ min: 1, max: 99999 })),
  name: faker.word.words(2),
  key: faker.string.hexadecimal({ length: 40, prefix: '', casing: 'lower' }),
  created: faker.date.past().toISOString(),
  ...overrides,
});

/** The same token as the endpoint sends it. */
export const toPersonalTokenResource = ({
  id,
  ...attributes
}: ApiPersonalToken): ApiPersonalTokenResource => ({ id, type: 'personaltokens', attributes });
