import { describe, expect, it } from 'vitest';

import { DEFAULT_MESSAGES, loadMessages } from '@irene/translations/messages';

import en from './generated/en.json';
import ja from './generated/ja.json';

describe('messages', () => {
  it('defaults to the English messages', () => {
    expect(DEFAULT_MESSAGES).toBe(en);
  });

  describe('loadMessages', () => {
    it('returns the English messages for en', async () => {
      await expect(loadMessages('en')).resolves.toBe(en);
    });

    it('loads the Japanese messages for ja', async () => {
      await expect(loadMessages('ja')).resolves.toEqual(ja);
    });

    it('loads a locale carrying the same message ids as English', async () => {
      const messages = await loadMessages('ja');

      const byName = (a: string, b: string) => a.localeCompare(b);

      expect(Object.keys(messages).sort(byName)).toEqual(Object.keys(en).sort(byName));
    });
  });
});
