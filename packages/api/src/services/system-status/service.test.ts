import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { HTTP_STATUS_CODES } from '@irene/constants';
import { StatusEndpoints, StatusService } from '@irene/api/services/system-status';
import { buildAPITestURL, server } from '@tests/server';

const STORAGE_PROBE_URL = 'https://storage.test/probe-object';

const statusUrl = buildAPITestURL(StatusEndpoints.status());
const pingUrl = buildAPITestURL(StatusEndpoints.ping());

/** Answers the endpoint that hands back the object store's pre-signed URL. */
const storageProbeIs = (url: string) =>
  server.use(http.get(statusUrl, () => HttpResponse.json({ data: { storage: url } })));

describe('StatusService.checkStorage', () => {
  it('resolves true when the pre-signed URL answers 404', async () => {
    storageProbeIs(STORAGE_PROBE_URL);

    server.use(
      http.get(STORAGE_PROBE_URL, () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.NOT_FOUND })
      )
    );

    await expect(StatusService.checkStorage()).resolves.toBe(true);
  });

  it('resolves false for any other status', async () => {
    storageProbeIs(STORAGE_PROBE_URL);

    server.use(http.get(STORAGE_PROBE_URL, () => HttpResponse.json({})));

    await expect(StatusService.checkStorage()).resolves.toBe(false);
  });

  it('resolves false when the pre-signed URL never answers', async () => {
    storageProbeIs(STORAGE_PROBE_URL);

    server.use(http.get(STORAGE_PROBE_URL, () => HttpResponse.error()));

    await expect(StatusService.checkStorage()).resolves.toBe(false);
  });

  it('resolves false when api/status is refused', async () => {
    server.use(
      http.get(statusUrl, () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    await expect(StatusService.checkStorage()).resolves.toBe(false);
  });
});

describe('StatusService.checkApi', () => {
  it('resolves true for any body api/ping returns', async () => {
    server.use(http.get(pingUrl, () => HttpResponse.json({ ping: 'not-pong' })));

    await expect(StatusService.checkApi()).resolves.toBe(true);
  });

  it('resolves false when api/ping never answers', async () => {
    server.use(http.get(pingUrl, () => HttpResponse.error()));

    await expect(StatusService.checkApi()).resolves.toBe(false);
  });
});
