import { isAxiosError } from 'axios';
import { http, HttpResponse, type JsonBodyType } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HTTP_STATUS_CODES } from '@irene/constants';
import { ENUMS } from '@irene/enums';

import { apiRequest, currentProduct, request } from '@irene/api/request';
import { getApiErrorPayload, getApiErrorStatus } from '@irene/api/utils/errors';
import { storeSession } from '@irene/api/utils/session';
import { buildAPITestURL, server } from '@tests/server';

const PING = buildAPITestURL('api/ping');

/** Captures what the client actually sent. */
function intercept(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  status = 200,
  data: JsonBodyType = {}
) {
  const seen: { body: string; product: string | null; auth: string | null; url: string } = {
    body: '',
    product: null,
    auth: null,
    url: '',
  };

  server.use(
    http[method](PING, async ({ request: sent }) => {
      seen.body = await sent.text();
      seen.product = sent.headers.get('X-Product');
      seen.auth = sent.headers.get('Authorization');
      seen.url = sent.url;

      return HttpResponse.json(data, { status });
    })
  );

  return seen;
}

const realLocation = window.location;

/** The host is read when the client is created, so each case needs a fresh module. */
async function clientWith(tiers: { injected?: string; baked?: string; hostname?: string }) {
  vi.resetModules();

  if (tiers.hostname) {
    Object.defineProperty(window, 'location', {
      value: { ...realLocation, hostname: tiers.hostname },
      configurable: true,
    });
  }

  globalThis.__BUILD_CONFIG__ = tiers.baked ? { IRENE_API_HOST: tiers.baked } : {};

  if (tiers.injected) {
    window.runtimeGlobalConfig = { IRENE_API_HOST: tiers.injected };
  } else {
    delete window.runtimeGlobalConfig;
  }

  return (await import('@irene/api/request')).client;
}

describe('host resolution', () => {
  it('takes the host from the injected tier', async () => {
    const fresh = await clientWith({ injected: 'https://injected.example.com' });

    expect(fresh.defaults.baseURL).toBe('https://injected.example.com');
  });

  it('takes the host from the build tier when nothing is injected', async () => {
    const fresh = await clientWith({ baked: 'https://baked.example.com' });

    expect(fresh.defaults.baseURL).toBe('https://baked.example.com');
  });

  it('prefers the injected host over the baked one', async () => {
    const fresh = await clientWith({
      baked: 'https://baked.example.com',
      injected: 'https://injected.example.com',
    });

    expect(fresh.defaults.baseURL).toBe('https://injected.example.com');
  });

  it('falls back to the resolver default', async () => {
    const fresh = await clientWith({});

    expect(fresh.defaults.baseURL).toBe('https://api.appknox.com');
  });

  it('reads a host of / as same origin', async () => {
    const fresh = await clientWith({ injected: '/' });

    expect(fresh.defaults.baseURL).toBe('');
  });
});

describe('product header', () => {
  it('sends Appknox from any host but the Devknox one', async () => {
    const fresh = await clientWith({ hostname: 'dashboard.example.test' });

    expect(currentProduct()).toBe(ENUMS.PRODUCT.APPKNOX);
    expect(fresh.defaults.headers['X-Product']).toBe('0');
  });

  it('sends Devknox from the Devknox host', async () => {
    const fresh = await clientWith({ hostname: 'secure.devknox.io' });

    expect(fresh.defaults.headers['X-Product']).toBe('1');
  });

  it('puts it on every request', async () => {
    Object.defineProperty(window, 'location', { value: realLocation, configurable: true });

    const seen = intercept('get');

    await request({ url: 'api/ping' });

    expect(seen.product).toBe('0');
  });
});

describe('request', () => {
  it('unwraps the response to its data', async () => {
    intercept('get', 200, { id: 7 });

    await expect(request({ url: 'api/ping' })).resolves.toEqual({ id: 7 });
  });

  it('sends the body exactly as written', async () => {
    const seen = intercept('post');

    await request({ url: 'api/ping', method: 'POST', data: { is_active: true } });

    expect(JSON.parse(seen.body)).toEqual({ is_active: true });
  });

  it('rejects with the status, code and body', async () => {
    intercept('get', 403, { detail: 'Forbidden' });

    const error = await request({ url: 'api/ping' }).catch((reason: unknown) => reason);

    expect(getApiErrorStatus(error)).toBe(HTTP_STATUS_CODES.FORBIDDEN);
    expect(isAxiosError(error) ? error.code : undefined).toBe('ERR_BAD_REQUEST');
    expect(getApiErrorPayload(error)).toEqual({ detail: 'Forbidden' });
  });

  it('rejects with an Error that isAxiosError recognises', async () => {
    intercept('get', 500);

    const error = await request({ url: 'api/ping' }).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(Error);
    expect(isAxiosError(error)).toBe(true);
  });
});

describe('verb helpers', () => {
  it.each([
    ['get', 'get'],
    ['post', 'post'],
    ['put', 'put'],
    ['patch', 'patch'],
    ['delete', 'delete'],
  ] as const)('%s sets its own method', async (verb, method) => {
    const seen = intercept(method);

    await (verb === 'get' || verb === 'delete'
      ? apiRequest[verb]('api/ping')
      : apiRequest[verb]('api/ping', { a: 1 }));

    expect(seen.url).toContain('api/ping');
  });

  it('post, put and patch carry the body; get and delete do not', async () => {
    const posted = intercept('post');
    await apiRequest.post('api/ping', { a: 1 });
    expect(JSON.parse(posted.body)).toEqual({ a: 1 });

    const got = intercept('get');
    await apiRequest.get('api/ping');
    expect(got.body).toBe('');
  });

  it('passes extra options through', async () => {
    const seen = intercept('post');

    await apiRequest.post('api/ping', {}, { headers: { Authorization: 'Basic abc' } });

    expect(seen.auth).toBe('Basic abc');
  });

  it('propagates a failure from every verb', async () => {
    intercept('delete', 500);

    await expect(apiRequest.delete('api/ping')).rejects.toThrow('500');
  });
});

describe('the credential interceptor', () => {
  const PING_URL = buildAPITestURL('api/ping');

  /** Answer one request, recording the credential it carried. */
  function interceptPing() {
    const seen: { authorization: string | null } = { authorization: null };

    server.use(
      http.get(PING_URL, ({ request }) => {
        seen.authorization = request.headers.get('Authorization');

        return HttpResponse.json({});
      })
    );

    return seen;
  }

  afterEach(() => {
    window.localStorage.clear();
  });

  it('attaches the stored credential, so no call site has to', async () => {
    storeSession({ token: 'tok3n', userId: 42, b64token: 'NDI6dG9rM24=' });

    const seen = interceptPing();

    await request({ url: 'api/ping' });

    expect(seen.authorization).toBe('Basic NDI6dG9rM24=');
  });

  it('sends none when signed out, rather than an empty credential', async () => {
    const seen = interceptPing();

    await request({ url: 'api/ping' });

    expect(seen.authorization).toBeNull();
  });

  it('leaves an explicit credential alone, for one not yet stored', async () => {
    storeSession({ token: 'tok3n', userId: 42, b64token: 'NDI6dG9rM24=' });

    const seen = interceptPing();

    await request({ url: 'api/ping', headers: { Authorization: 'Basic OTk6b3RoZXI=' } });

    expect(seen.authorization).toBe('Basic OTk6b3RoZXI=');
  });

  it('reads storage per request, so signing in mid-session is picked up', async () => {
    const before = interceptPing();

    await request({ url: 'api/ping' });

    expect(before.authorization).toBeNull();

    storeSession({ token: 'tok3n', userId: 42, b64token: 'NDI6dG9rM24=' });

    const after = interceptPing();

    await request({ url: 'api/ping' });

    expect(after.authorization).toBe('Basic NDI6dG9rM24=');
  });
});
