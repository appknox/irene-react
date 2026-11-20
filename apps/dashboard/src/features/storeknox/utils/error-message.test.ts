import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';

import { skErrorMessage } from './error-message';

describe('skErrorMessage', () => {
  it('shows the server’s own message when the request carried one', () => {
    const message = faker.lorem.sentence();

    expect(skErrorMessage(message)).toBe(message);
  });

  it('falls back to “something went wrong” when the request explained nothing', () => {
    expect(skErrorMessage(new Error(faker.lorem.word()))).toBe(akMT('somethingWentWrong'));
  });

  it('shows the caller’s own fallback when one is given', () => {
    const fallback = faker.lorem.sentence();

    expect(skErrorMessage(undefined, fallback)).toBe(fallback);
  });
});
