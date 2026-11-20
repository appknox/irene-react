import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { PublicApiEndpoints, PublicApiService } from '@irene/api/services/public-api';
import { buildAPITestURL, server } from '@tests/server';

const schemaUrl = buildAPITestURL(PublicApiEndpoints.schema());

const SPEC = {
  openapi: '3.0.0',
  info: { title: 'Public API', version: '1.0.0' },
  paths: { '/api/public_api/v1/projects': {} },
};

describe('PublicApiService.getSchema', () => {
  it('resolves the OpenAPI document', async () => {
    server.use(http.get(schemaUrl, () => HttpResponse.json(SPEC)));

    await expect(PublicApiService.getSchema()).resolves.toEqual(SPEC);
  });

  it('asks for JSON, since the endpoint also serves YAML', async () => {
    let accept: string | null = null;

    server.use(
      http.get(schemaUrl, ({ request }) => {
        accept = request.headers.get('accept');

        return HttpResponse.json(SPEC);
      })
    );

    await PublicApiService.getSchema();

    expect(accept).toContain('application/json');
  });

  it('rejects when the endpoint refuses, so the screen can say so', async () => {
    server.use(http.get(schemaUrl, () => HttpResponse.error()));

    await expect(PublicApiService.getSchema()).rejects.toThrow();
  });
});
