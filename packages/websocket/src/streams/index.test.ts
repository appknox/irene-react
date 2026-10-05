import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { configurationStore } from '@irene/api/stores/configuration';

import {
  DEVICE_SESSION_TTL_MS,
  deviceStreamUrl,
  heldDeviceSession,
  holdDeviceSession,
  releaseAllDeviceSessions,
  releaseDeviceSession,
} from './index';

/** A device connection the registry can close. */
const buildSession = () => ({ close: vi.fn().mockResolvedValue(undefined) });

const setDeviceFarm = (url: string) => {
  configurationStore.getState().setServerConfiguration({
    websocket: '',
    devicefarm_url: url,
    enterprise: false,
  });
};

afterEach(async () => {
  await releaseAllDeviceSessions();
  vi.useRealTimers();
});

describe('deviceStreamUrl', () => {
  beforeEach(() => {
    setDeviceFarm('https://devicefarm.appknox.com');
  });

  it('opens against the farm the deployment reports', () => {
    expect(deviceStreamUrl('a-token')).toContain('devicefarm.appknox.com');
  });

  it('asks for the stream the farm serves, carrying the token', () => {
    expect(deviceStreamUrl('a-token')).toContain('/websockify?token=a-token');
  });

  it('turns a secure origin into a secure socket', () => {
    expect(deviceStreamUrl('a-token').startsWith('wss://')).toBe(true);
  });

  it('turns a plain origin into a plain socket', () => {
    setDeviceFarm('http://localhost:3000');

    expect(deviceStreamUrl('a-token').startsWith('ws://')).toBe(true);
  });

  it('escapes a token that would otherwise change the address', () => {
    expect(deviceStreamUrl('a token&role=admin')).toContain('a%20token%26role%3Dadmin');
  });

  it('refuses to build an unauthorized address', () => {
    expect(() => deviceStreamUrl('')).toThrow('token');
  });
});

describe('a held device session', () => {
  it('is handed back for the same device', () => {
    const session = buildSession();

    holdDeviceSession('serial-1', session);

    expect(heldDeviceSession('serial-1')).toBe(session);
  });

  it('is not handed back for another device', () => {
    holdDeviceSession('serial-1', buildSession());

    expect(heldDeviceSession('serial-2')).toBeUndefined();
  });

  it('is nothing before one is held', () => {
    expect(heldDeviceSession('serial-1')).toBeUndefined();
  });

  it('replaces the one held for that device, closing it', async () => {
    const first = buildSession();

    holdDeviceSession('serial-1', first);
    holdDeviceSession('serial-1', buildSession());

    await vi.waitFor(() => expect(first.close).toHaveBeenCalled());
  });

  it('is closed and forgotten when released', async () => {
    const session = buildSession();

    holdDeviceSession('serial-1', session);
    await releaseDeviceSession('serial-1');

    expect(session.close).toHaveBeenCalled();
    expect(heldDeviceSession('serial-1')).toBeUndefined();
  });

  it('is released quietly when none is held', async () => {
    await expect(releaseDeviceSession('serial-1')).resolves.toBeUndefined();
  });

  it('is closed once nothing has asked for it', async () => {
    vi.useFakeTimers();

    const session = buildSession();

    holdDeviceSession('serial-1', session);
    vi.advanceTimersByTime(DEVICE_SESSION_TTL_MS);

    expect(session.close).toHaveBeenCalled();
  });

  it('is kept while it is still being asked for', () => {
    vi.useFakeTimers();

    const session = buildSession();

    holdDeviceSession('serial-1', session);

    vi.advanceTimersByTime(DEVICE_SESSION_TTL_MS - 1);
    heldDeviceSession('serial-1');
    vi.advanceTimersByTime(DEVICE_SESSION_TTL_MS - 1);

    expect(session.close).not.toHaveBeenCalled();
  });
});

describe('releaseAllDeviceSessions', () => {
  it('closes every device still connected, which is what signing out does', async () => {
    const first = buildSession();
    const second = buildSession();

    holdDeviceSession('serial-1', first);
    holdDeviceSession('serial-2', second);

    await releaseAllDeviceSessions();

    expect(first.close).toHaveBeenCalled();
    expect(second.close).toHaveBeenCalled();
    expect(heldDeviceSession('serial-1')).toBeUndefined();
  });

  it('closes quietly when nothing is connected', async () => {
    await expect(releaseAllDeviceSessions()).resolves.toBeUndefined();
  });
});
