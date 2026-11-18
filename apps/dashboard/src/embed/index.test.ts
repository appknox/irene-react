import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/dashboard/pages/home', () => ({
  HomePage: () => 'home',
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
