import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { HTTP_STATUS_CODES } from '@irene/constants';

import { UploadAppEndpoints, UploadAppService } from '@irene/api/services/upload-app';
import { getApiErrorStatus } from '@irene/api/utils/errors';
import { storeSession } from '@irene/api/utils/session';
import { buildPresignedUpload, buildSession, buildUploadedApp } from '@tests/factories';
import { buildAPITestURL, server } from '@tests/server';

const ORGANIZATION_ID = 42;

const uploadUrl = buildAPITestURL(UploadAppEndpoints.upload(ORGANIZATION_ID));
const offsecUploadUrl = buildAPITestURL(UploadAppEndpoints.offsecUpload(ORGANIZATION_ID));

const buildBinary = () =>
  new File(['an apk'], 'app.apk', { type: 'application/vnd.android.package-archive' });

describe('UploadAppService.getPresignedUpload', () => {
  it('asks the organization where to upload', async () => {
    const presignedUpload = buildPresignedUpload();

    server.use(http.get(uploadUrl, () => HttpResponse.json(presignedUpload)));

    await expect(
      UploadAppService.getPresignedUpload({ organizationId: ORGANIZATION_ID })
    ).resolves.toEqual(presignedUpload);
  });

  it('asks the offensive-security queue instead when the upload is for it', async () => {
    const presignedUpload = buildPresignedUpload();

    server.use(http.get(offsecUploadUrl, () => HttpResponse.json(presignedUpload)));

    await expect(
      UploadAppService.getPresignedUpload({ organizationId: ORGANIZATION_ID, isOffsec: true })
    ).resolves.toEqual(presignedUpload);
  });

  it('rejects when the organization may not upload', async () => {
    server.use(
      http.get(uploadUrl, () =>
        HttpResponse.json({ detail: 'Forbidden' }, { status: HTTP_STATUS_CODES.FORBIDDEN })
      )
    );

    const error = await UploadAppService.getPresignedUpload({
      organizationId: ORGANIZATION_ID,
    }).catch((reason: unknown) => reason);

    expect(getApiErrorStatus(error)).toBe(HTTP_STATUS_CODES.FORBIDDEN);
  });
});

describe('UploadAppService.uploadBinary', () => {
  /*
    Storage signs the URL itself and refuses a request that also carries our
    header: "only one auth mechanism allowed". The API client attaches one to
    everything, so the binary cannot go through it.
  */
  it('carries no session to storage, which signs the URL instead', async () => {
    storeSession(buildSession());

    const { url } = buildPresignedUpload();
    const sent: { authorization?: string | null } = {};

    server.use(
      http.put(url, ({ request }) => {
        sent.authorization = request.headers.get('authorization');

        return new HttpResponse(null, { status: HTTP_STATUS_CODES.OK });
      })
    );

    await UploadAppService.uploadBinary({ url, file: buildBinary() });

    expect(sent.authorization).toBeNull();
  });

  it('still carries the session when asking the API where to upload', async () => {
    storeSession(buildSession());

    const sent: { authorization?: string | null } = {};

    server.use(
      http.get(uploadUrl, ({ request }) => {
        sent.authorization = request.headers.get('authorization');

        return HttpResponse.json(buildPresignedUpload());
      })
    );

    await UploadAppService.getPresignedUpload({ organizationId: ORGANIZATION_ID });

    expect(sent.authorization).toMatch(/^Basic /);
  });

  /*
    The bytes themselves are not asserted: a Blob body is not readable through
    the interception under jsdom, which reports it as the string "undefined".
    What the service decides — the verb, the address and the type — is.
  */
  it('puts the binary at the signed URL', async () => {
    const { url } = buildPresignedUpload();
    const sent: { method?: string; contentType?: string | null } = {};

    server.use(
      http.put(url, ({ request }) => {
        sent.method = request.method;
        sent.contentType = request.headers.get('content-type');

        return new HttpResponse(null, { status: HTTP_STATUS_CODES.OK });
      })
    );

    const file = buildBinary();

    await UploadAppService.uploadBinary({ url, file });

    expect(sent.method).toBe('PUT');
    expect(sent.contentType).toBe(file.type);
  });

  it('names a type for a binary the browser could not identify', async () => {
    const { url } = buildPresignedUpload();
    const sent: { contentType?: string | null } = {};

    server.use(
      http.put(url, ({ request }) => {
        sent.contentType = request.headers.get('content-type');

        return new HttpResponse(null, { status: HTTP_STATUS_CODES.OK });
      })
    );

    await UploadAppService.uploadBinary({ url, file: new File(['an aab'], 'app.aab') });

    expect(sent.contentType).toBe('application/octet-stream');
  });

  it('reports how much of the file has gone', async () => {
    const { url } = buildPresignedUpload();
    const onProgress = vi.fn();

    server.use(http.put(url, () => new HttpResponse(null, { status: HTTP_STATUS_CODES.OK })));

    await UploadAppService.uploadBinary({ url, file: buildBinary(), onProgress });

    expect(onProgress).toHaveBeenCalledWith(100);
  });

  it('rejects when storage refuses the binary', async () => {
    const { url } = buildPresignedUpload();

    server.use(
      http.put(url, () => new HttpResponse(null, { status: HTTP_STATUS_CODES.FORBIDDEN }))
    );

    await expect(UploadAppService.uploadBinary({ url, file: buildBinary() })).rejects.toThrow();
  });
});

describe('UploadAppService.confirmUpload', () => {
  it('posts file_key and file_key_signed, and returns submission_id', async () => {
    const uploaded = buildUploadedApp();
    const sent: { body?: unknown } = {};

    server.use(
      http.post(uploadUrl, async ({ request }) => {
        sent.body = await request.json();

        return HttpResponse.json(uploaded, { status: HTTP_STATUS_CODES.ACCEPTED });
      })
    );

    const confirmed = await UploadAppService.confirmUpload(
      { file_key: uploaded.file_key, file_key_signed: uploaded.file_key_signed },
      { organizationId: ORGANIZATION_ID }
    );

    expect(sent.body).toEqual({
      file_key: uploaded.file_key,
      file_key_signed: uploaded.file_key_signed,
    });

    expect(confirmed.submission_id).toBe(uploaded.submission_id);
  });

  it('confirms an offensive-security upload to its own queue', async () => {
    const uploaded = buildUploadedApp();

    server.use(
      http.post(offsecUploadUrl, () =>
        HttpResponse.json(uploaded, { status: HTTP_STATUS_CODES.ACCEPTED })
      )
    );

    await expect(
      UploadAppService.confirmUpload(
        { file_key: uploaded.file_key, file_key_signed: uploaded.file_key_signed },
        { organizationId: ORGANIZATION_ID, isOffsec: true }
      )
    ).resolves.toMatchObject({ submission_id: uploaded.submission_id });
  });

  it('rejects with a 429 when another upload is not accepted yet', async () => {
    server.use(
      http.post(uploadUrl, () =>
        HttpResponse.json(
          { detail: JSON.stringify({ lock_time: 30 }) },
          { status: HTTP_STATUS_CODES.TOO_MANY_REQUESTS }
        )
      )
    );

    const error = await UploadAppService.confirmUpload(
      { file_key: 'a-key', file_key_signed: 'a-signed-key' },
      { organizationId: ORGANIZATION_ID }
    ).catch((reason: unknown) => reason);

    expect(getApiErrorStatus(error)).toBe(HTTP_STATUS_CODES.TOO_MANY_REQUESTS);
  });
});
