import { describe, expect, it, vi } from 'vitest';

/* Same factory as mount-component.test.ts: modules are shared between files
   here, so the first mock registered is the one both of them get. */
vi.mock('@/features/dashboard/pages/home', () => ({
  HomePage: (props: Record<string, unknown>) => `home:${props.label ?? ''}`,
}));

describe('the embed entry point', () => {
  it('publishes the mount function on the global', async () => {
    await import('./index');

    const published = (globalThis as Record<string, unknown>)['__ireneEmbed'];

    expect(published).toStrictEqual({ mountIreneComponent: expect.any(Function) });
  });

  it('publishes it where a host that cannot import by URL will find it', async () => {
    const { mountIreneComponent } = await import('./index');

    const published = (globalThis as Record<string, unknown>)['__ireneEmbed'] as {
      mountIreneComponent: unknown;
    };

    expect(published.mountIreneComponent).toBe(mountIreneComponent);
  });
});
