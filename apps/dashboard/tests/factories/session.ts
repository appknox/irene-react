import { faker } from '@faker-js/faker';
import { buildBasicCredential, type IreneAuthSession } from '@irene/api/utils/session';

/**
 * A stored session, with its credential built rather than written by hand.
 *
 * `b64token` is derived, so overriding the id or token keeps it correct. Tests
 * that assert the encoding itself should spell all three out instead.
 *
 * @param overrides - What this test cares about.
 * @returns The session as it is stored.
 */
export const buildSession = (overrides: Partial<IreneAuthSession> = {}): IreneAuthSession => {
  const userId = overrides.userId ?? faker.number.int({ min: 1, max: 9999 });
  const token = overrides.token ?? faker.string.alphanumeric(32);

  return {
    userId,
    token,
    b64token: buildBasicCredential(userId, token),
    ...overrides,
  };
};
