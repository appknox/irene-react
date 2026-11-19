import { describe, expect, it, vi } from 'vitest';

/* Same factory as mount-component.test.ts: modules are shared between files
   here, so the first mock registered is the one both of them get. */
vi.mock('@/features/dashboard/pages/home', () => ({
  HomePage: (props: Record<string, unknown>) => `home:${props.label ?? ''}`,
}));

describe('the embed entry point', () => {
  it('publishes the mount function where a host can reach it', async () => {
    await import('./index');

    expect(globalThis.__ireneEmbed).toStrictEqual({
      mountIreneComponent: expect.any(Function),
    });
  });
});
