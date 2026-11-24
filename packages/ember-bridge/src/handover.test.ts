import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/* Reimported per case: whether handovers are on is module state. */
async function loadHandover() {
  vi.resetModules();

  return import('./handover.ts');
}

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('startEmberHandover', () => {
  it('claims nothing until handovers are enabled', async () => {
    const { startEmberHandover } = await loadHandover();

    expect(startEmberHandover('/dashboard/projects')).toBeUndefined();
  });

  it('claims a path the Ember app owns once enabled', async () => {
    const { startEmberHandover, enableEmberHandover } = await loadHandover();

    enableEmberHandover();

    expect(startEmberHandover('/dashboard/projects')).toBe('/dashboard/projects');
  });

  it('leaves a path this app serves alone', async () => {
    const { startEmberHandover, enableEmberHandover } = await loadHandover();

    enableEmberHandover();

    expect(startEmberHandover('/startup-sequence/test')).toBeUndefined();
  });

  it('refuses a second attempt at a path the first did not land on', async () => {
    const { startEmberHandover, enableEmberHandover } = await loadHandover();

    enableEmberHandover();

    expect(startEmberHandover('/dashboard/projects')).toBe('/dashboard/projects');
    expect(startEmberHandover('/dashboard/projects')).toBeUndefined();
  });

  it('still claims a different path while one is being attempted', async () => {
    const { startEmberHandover, enableEmberHandover } = await loadHandover();

    enableEmberHandover();
    startEmberHandover('/dashboard/projects');

    expect(startEmberHandover('/dashboard/settings')).toBe('/dashboard/settings');
  });

  it('claims a path again once the attempt has had time to land', async () => {
    vi.useFakeTimers();

    const { startEmberHandover, enableEmberHandover } = await loadHandover();

    enableEmberHandover();
    expect(startEmberHandover('/dashboard/projects')).toBe('/dashboard/projects');

    vi.advanceTimersByTime(5_001);

    expect(startEmberHandover('/dashboard/projects')).toBe('/dashboard/projects');
  });

  it('hands over unguarded where storage is unavailable', async () => {
    const { startEmberHandover, enableEmberHandover } = await loadHandover();

    enableEmberHandover();

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage is blocked');
    });

    expect(startEmberHandover('/dashboard/projects')).toBe('/dashboard/projects');
    expect(startEmberHandover('/dashboard/projects')).toBe('/dashboard/projects');
  });
});
