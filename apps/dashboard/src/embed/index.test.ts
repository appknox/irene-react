import { describe, expect, it } from 'vitest';

describe('the embed entry point', () => {
  it('publishes the mount function where a host can reach it', async () => {
    await import('./index');

    expect(globalThis.__ireneEmbed).toStrictEqual({
      mountIreneComponent: expect.any(Function),
    });
  });
});
