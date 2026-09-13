import { afterEach, describe, expect, it } from 'vitest';
import type { InternalAxiosRequestConfig } from 'axios';

import { apiClient, currentProduct, PRODUCT } from '@irene/api';

const realLocation = window.location;

/** Point the address bar at a hostname for one case. */
function serveFrom(hostname: string) {
  Object.defineProperty(window, 'location', {
    value: { ...realLocation, hostname },
    configurable: true,
  });
}

/**
 * Run a request through the real interceptor chain and hand back the config the
 * adapter was asked to send, so the assertions see what a request would carry.
 */
async function sendRequest(): Promise<InternalAxiosRequestConfig> {
  let sent: InternalAxiosRequestConfig | undefined;

  apiClient.defaults.adapter = async (config) => {
    sent = config;

    return { data: null, status: 200, statusText: 'OK', headers: {}, config };
  };

  await apiClient.get('/ping');

  return sent as InternalAxiosRequestConfig;
}

afterEach(() => {
  Object.defineProperty(window, 'location', { value: realLocation, configurable: true });
});

describe('host resolution', () => {
  it('takes the host from the injected tier', async () => {
    window.runtimeGlobalConfig = { IRENE_API_HOST: 'https://injected.example.com' };

    const sentRequest = await sendRequest();
    expect(sentRequest.baseURL).toBe('https://injected.example.com');
  });

  it('takes the host from the build tier when nothing is injected', async () => {
    globalThis.__BUILD_CONFIG__ = { IRENE_API_HOST: 'https://baked.example.com' };

    const sentRequest = await sendRequest();
    expect(sentRequest.baseURL).toBe('https://baked.example.com');
  });

  it('prefers the injected host over the baked one', async () => {
    globalThis.__BUILD_CONFIG__ = { IRENE_API_HOST: 'https://baked.example.com' };
    window.runtimeGlobalConfig = { IRENE_API_HOST: 'https://injected.example.com' };

    const sentRequest = await sendRequest();
    expect(sentRequest.baseURL).toBe('https://injected.example.com');
  });

  it('falls back to the resolver default when no tier sets the host', async () => {
    const sentRequest = await sendRequest();
    expect(sentRequest.baseURL).toBe('https://api.appknox.com');
  });

  it('reads a host of / as same origin', async () => {
    window.runtimeGlobalConfig = { IRENE_API_HOST: '/' };

    const sentRequest = await sendRequest();
    expect(sentRequest.baseURL).toBe('');
  });

  it('resolves the host per request rather than at import', async () => {
    window.runtimeGlobalConfig = { IRENE_API_HOST: 'https://first.example.com' };
    let sentRequest = await sendRequest();
    expect(sentRequest.baseURL).toBe('https://first.example.com');

    window.runtimeGlobalConfig = { IRENE_API_HOST: 'https://second.example.com' };
    sentRequest = await sendRequest();
    expect(sentRequest.baseURL).toBe('https://second.example.com');
  });
});

describe('product header', () => {
  it('sends Appknox from any host but the Devknox one', () => {
    serveFrom('secure.appknox.com');
    expect(currentProduct()).toBe(PRODUCT.APPKNOX);
  });

  it('sends Devknox from the Devknox host', () => {
    serveFrom('secure.devknox.io');
    expect(currentProduct()).toBe(PRODUCT.DEVKNOX);
  });

  it('puts Appknox on every request', async () => {
    serveFrom('secure.appknox.com');

    const sentRequest = await sendRequest();
    expect(sentRequest.headers.get('X-Product')).toBe(String(PRODUCT.APPKNOX));
  });

  it('puts Devknox on every request', async () => {
    serveFrom('secure.devknox.io');

    const sentRequest = await sendRequest();
    expect(sentRequest.headers.get('X-Product')).toBe(String(PRODUCT.DEVKNOX));
  });
});
