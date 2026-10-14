import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@tests/server';

import { FreshdeskEndpoints } from './endpoints';
import FreshdeskService from './service';

describe('FreshdeskService', () => {
  it('asks for a token naming the signed-in account', async () => {
    server.use(
      http.post(`*/${FreshdeskEndpoints.authenticate()}`, () =>
        HttpResponse.json({ token: 'a-jwt', name: 'ada', email: 'ada@appknox.com' })
      )
    );

    await expect(FreshdeskService.authenticate()).resolves.toEqual({
      token: 'a-jwt',
      name: 'ada',
      email: 'ada@appknox.com',
    });
  });

  it('rejects when the deployment holds no Freshdesk secret', async () => {
    server.use(
      http.post(`*/${FreshdeskEndpoints.authenticate()}`, () =>
        HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
      )
    );

    await expect(FreshdeskService.authenticate()).rejects.toThrow();
  });
});
