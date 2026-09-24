import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DeviceFarmEndpoints, DeviceFarmService } from '@irene/api/services/device-farm';
import { server } from '@tests/server';

const CONFIGURED_HOST = 'https://device-farm.test';
const pingUrl = (host: string) => new URL(DeviceFarmEndpoints.ping(), host).href;

describe('DeviceFarmService.resolveHost', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    globalThis.__BUILD_CONFIG__ = {};
  });

  it('returns the configured device farm host', () => {
    expect(DeviceFarmService.resolveHost(CONFIGURED_HOST)).toBe('https://device-farm.test/');
  });

  it('falls back to the API host when no device farm host is configured', () => {
    expect(DeviceFarmService.resolveHost('')).toBe('https://api.appknox.com/');
  });

  it('falls back to window.location when neither host is configured', () => {
    /* Same-origin, which the config layer normalises to an empty base URL. */
    globalThis.__BUILD_CONFIG__ = { IRENE_API_HOST: '/' };
    vi.stubGlobal('location', { href: 'https://secure.test/dashboard/status' });

    expect(DeviceFarmService.resolveHost('')).toBe('https://secure.test/');
  });

  it('returns null when no candidate parses as a URL', () => {
    globalThis.__BUILD_CONFIG__ = { IRENE_API_HOST: '/' };
    vi.stubGlobal('location', { href: '' });

    expect(DeviceFarmService.resolveHost('')).toBeNull();
  });
});

describe('DeviceFarmService.ping', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    globalThis.__BUILD_CONFIG__ = {};
  });

  it('resolves false when no host resolves', async () => {
    globalThis.__BUILD_CONFIG__ = { IRENE_API_HOST: '/' };
    vi.stubGlobal('location', { href: '' });

    await expect(DeviceFarmService.ping('')).resolves.toBe(false);
  });

  it('resolves true when the ping answers pong', async () => {
    server.use(http.get(pingUrl(CONFIGURED_HOST), () => HttpResponse.json({ ping: 'pong' })));

    await expect(DeviceFarmService.ping(CONFIGURED_HOST)).resolves.toBe(true);
  });

  it('resolves false when the ping answers anything but pong', async () => {
    server.use(http.get(pingUrl(CONFIGURED_HOST), () => HttpResponse.json({ ping: 'nope' })));

    await expect(DeviceFarmService.ping(CONFIGURED_HOST)).resolves.toBe(false);
  });

  it('resolves false when the ping never answers', async () => {
    server.use(http.get(pingUrl(CONFIGURED_HOST), () => HttpResponse.error()));

    await expect(DeviceFarmService.ping(CONFIGURED_HOST)).resolves.toBe(false);
  });
});
