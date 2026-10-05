import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { SubmissionEndpoints } from '@irene/api/services/submission';
import { storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';
import { WEBSOCKET_EVENTS } from '@irene/websocket/testing';

import {
  buildPresignedUpload,
  buildSession,
  buildSubmission,
  buildSubmissionAppData,
} from '@tests/factories';

import { mockOrganizationFeatures } from '@tests/organization';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';
import { websocketTransport } from '@tests/setup';

const session = buildSession();
const presignedUpload = buildPresignedUpload({ url: 'https://storage.example.test/an-upload' });

/* The organization is whichever one the page selected, so the id is matched rather than named. */
const UPLOAD_URL = '*/api/organizations/*/upload_app';

/** The file a person picks, which the input reports as chosen. */
const buildBinary = (name = 'app.apk') =>
  new File(['an apk'], name, { type: 'application/vnd.android.package-archive' });

/** Answers every step of an upload, and reports where the binary went. */
const serverAcceptsUploads = () => {
  const sent = { binaryReceived: false };

  server.use(
    http.get(UPLOAD_URL, () => HttpResponse.json(presignedUpload)),

    http.put(presignedUpload.url, () => {
      sent.binaryReceived = true;

      return new HttpResponse(null, { status: HTTP_STATUS_CODES.OK });
    }),

    http.post(UPLOAD_URL, () =>
      HttpResponse.json(
        { ...presignedUpload, submission_id: 1 },
        { status: HTTP_STATUS_CODES.ACCEPTED }
      )
    ),

    http.get(buildAPITestURL(SubmissionEndpoints.list()), () =>
      HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
    )
  );

  return sent;
};

/** Opens a signed-in page and hands over the hidden file input. */
const openPage = async () => {
  renderAtRoute('/dashboard/projects');

  await screen.findByText(akMT('startNewScan'));

  return document.querySelector<HTMLInputElement>('[data-test-upload-via-system-input]');
};

describe('UploadViaSystem', () => {
  beforeEach(() => {
    storeSession(session);
    mockOrganizationFeatures({});
  });

  it('sends the binary the person picked', async () => {
    const sent = serverAcceptsUploads();
    const input = await openPage();

    await userEvent.upload(input!, buildBinary());

    await waitFor(() => expect(sent.binaryReceived).toBe(true));
  });

  it('opens the status popover as the upload starts, before the server has it', async () => {
    serverAcceptsUploads();

    /* Held open, so the assertion sees the upload in flight rather than after it. */
    server.use(http.put(presignedUpload.url, async () => delay('infinite')));

    const input = await openPage();

    await userEvent.upload(input!, buildBinary('appknox.apk'));

    expect(await screen.findByText(akMT('uploadStatus'))).toBeInTheDocument();

    /* The server has named nothing yet, so the row reads as a file still going. */
    expect(document.querySelector('[data-test-upload-sending-row]')).toBeInTheDocument();
    expect(screen.getByText(`${akMT('uploading')}...`)).toBeInTheDocument();
  });

  it('drops the sending row once the server has the upload', async () => {
    serverAcceptsUploads();
    const input = await openPage();

    await userEvent.upload(input!, buildBinary('appknox.apk'));

    await waitFor(() =>
      expect(document.querySelector('[data-test-upload-sending-row]')).not.toBeInTheDocument()
    );
  });

  it('replaces the sending row with the submission the server made of it', async () => {
    serverAcceptsUploads();

    const input = await openPage();

    await userEvent.upload(input!, buildBinary('appknox.apk'));

    /* The row for the file being sent goes as soon as the server has it. */
    await waitFor(() =>
      expect(document.querySelector('[data-test-upload-sending-row]')).not.toBeInTheDocument()
    );

    websocketTransport.emit(WEBSOCKET_EVENTS.modelCreated, {
      model_name: 'submission',
      data: buildSubmission({ id: 1, app_data: buildSubmissionAppData({ name: 'Just Uploaded' }) }),
    });

    await userEvent.click(await screen.findByRole('button', { name: akMT('uploadStatus') }));

    expect(await screen.findByText('Just Uploaded')).toBeInTheDocument();

    /* One row for the one upload, rather than the submission beside the file that became it. */
    expect(document.querySelectorAll('[data-test-upload-status-row]')).toHaveLength(1);
  });

  it('takes another file while one is still going', async () => {
    serverAcceptsUploads();

    /* Held open, so both uploads are in flight at once. */
    server.use(http.put(presignedUpload.url, async () => delay('infinite')));

    const input = await openPage();

    await userEvent.upload(input!, buildBinary('first.apk'));
    await userEvent.upload(input!, buildBinary('second.apk'));

    await waitFor(() =>
      expect(document.querySelectorAll('[data-test-upload-sending-row]')).toHaveLength(2)
    );

    expect(screen.getByRole('button', { name: akMT('uploadApp') })).toBeEnabled();
  });

  it('refuses a file the server would not accept, without sending it', async () => {
    const sent = serverAcceptsUploads();
    const input = await openPage();

    /* The picker itself filters by extension, so the refusal under test needs it bypassed. */
    await userEvent.upload(input!, new File(['notes'], 'notes.txt', { type: 'text/plain' }), {
      applyAccept: false,
    });

    expect(await screen.findByText(akMT('invalidFileType'))).toBeInTheDocument();
    expect(sent.binaryReceived).toBe(false);
  });

  it('shows an error toast when the PUT to S3 fails', async () => {
    serverAcceptsUploads();

    server.use(
      http.get(UPLOAD_URL, () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    const input = await openPage();

    await userEvent.upload(input!, buildBinary());

    expect(await screen.findByText(akMT('errorWhileUploading'))).toBeInTheDocument();
  });
});
