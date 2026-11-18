import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/* Reimported per case: whether handovers are on is module state. */
async function loadHandover() {
  vi.resetModules();

  return import('./ember-handover');
}

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('claimEmberHandover', () => {
  it('claims nothing until handovers are enabled', async () => {
    const { claimEmberHandover } = await loadHandover();

    expect(claimEmberHandover('/dashboard/projects')).toBeUndefined();
  });

  it('claims a path the Ember app owns once enabled', async () => {
    const { claimEmberHandover, enableEmberHandover } = await loadHandover();

    enableEmberHandover();

    expect(claimEmberHandover('/dashboard/projects')).toBe('/dashboard/projects');
  });

  it('leaves a path this app serves alone', async () => {
    const { claimEmberHandover, enableEmberHandover } = await loadHandover();

    enableEmberHandover();

    expect(claimEmberHandover('/dashboard/home')).toBeUndefined();
  });

  it('refuses a second attempt at a path the first did not land on', async () => {
    const { claimEmberHandover, enableEmberHandover } = await loadHandover();

    enableEmberHandover();

    expect(claimEmberHandover('/dashboard/projects')).toBe('/dashboard/projects');
    expect(claimEmberHandover('/dashboard/projects')).toBeUndefined();
  });

  it('still claims a different path while one is being attempted', async () => {
    const { claimEmberHandover, enableEmberHandover } = await loadHandover();

    enableEmberHandover();
    claimEmberHandover('/dashboard/projects');

    expect(claimEmberHandover('/dashboard/settings')).toBe('/dashboard/settings');
  });

  it('claims a path again once the attempt has had time to land', async () => {
    vi.useFakeTimers();

    const { claimEmberHandover, enableEmberHandover } = await loadHandover();

    enableEmberHandover();
    expect(claimEmberHandover('/dashboard/projects')).toBe('/dashboard/projects');

    vi.advanceTimersByTime(5_001);

    expect(claimEmberHandover('/dashboard/projects')).toBe('/dashboard/projects');
  });

  it('hands over unguarded where storage is unavailable', async () => {
    const { claimEmberHandover, enableEmberHandover } = await loadHandover();

    enableEmberHandover();

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage is blocked');
    });

    expect(claimEmberHandover('/dashboard/projects')).toBe('/dashboard/projects');
    expect(claimEmberHandover('/dashboard/projects')).toBe('/dashboard/projects');
  });
});
