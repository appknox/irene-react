import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { tagRecordForCaching } from '@irene/api/normalization';
import { SubmissionEndpoints } from '@irene/api/services/submission';
import { storeSession } from '@irene/api/utils/session';
import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';
import { raiseWebsocketSignal } from '@irene/websocket';
import { WEBSOCKET_EVENTS } from '@irene/websocket/testing';

import { uploadAppStore } from '@/features/upload-app/store';
import { buildSession, buildSubmission, buildSubmissionAppData } from '@tests/factories';
import { mockOrganizationFeatures } from '@tests/organization';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';
import { websocketTransport } from '@tests/setup';

const session = buildSession();

const LIST_URL = buildAPITestURL(SubmissionEndpoints.list());

/** The list wrapper the server puts around its rows. */
const asListResponse = (results: object[]) => ({
  count: results.length,
  next: null,
  previous: null,
  results,
});

/** An upload the server is still validating, which is what "in flight" means. */
const buildUploadInFlight = (overrides = {}) =>
  buildSubmission({
    status: ENUMS.SUBMISSION_STATUS.VALIDATING,
    status_humanized: 'Validating',
    reason: '',
    app_data: buildSubmissionAppData({ name: 'Appknox Demo' }),
    ...overrides,
  });

/** Answers the list endpoint with these uploads, however many times it is asked. */
const serverHasUploads = (submissions: object[]) => {
  server.use(http.get(LIST_URL, () => HttpResponse.json(asListResponse(submissions))));
};

/** Opens a signed-in page and waits for the bar to have read the uploads. */
const openPageWithUploads = async (submissions: object[], route = '/dashboard/projects') => {
  serverHasUploads(submissions);

  renderAtRoute(route);

  await screen.findByText(akMT('startNewScan'));
};

/** Opens the status popover, which is where the counts and the rows are. */
const openStatusPopover = async () => {
  const trigger = await screen.findByRole('button', { name: akMT('uploadStatus') });

  await userEvent.click(trigger);
};

/** The counts in the trigger, in the order they are shown: running, finished, failed. */
const uploadCounts = () => document.querySelectorAll('[data-test-upload-status-count]');

/** What the one row on screen says the server last did with it. */
const rowStatus = () => document.querySelector('[data-test-upload-status-text]');

/**
 * Plays an event through the handlers the connection registered.
 *
 * Wrapped in `act`, because a pushed record is taken into state the moment it
 * arrives, outside anything the test awaited.
 */
const serverSends = (event: string, payload: unknown) => {
  act(() => {
    websocketTransport.emit(event, payload);
  });
};

describe('UploadStatus', () => {
  beforeEach(() => {
    storeSession(session);
    mockOrganizationFeatures({});
  });

  it('counts the uploads the server is still working on', async () => {
    await openPageWithUploads([buildUploadInFlight(), buildUploadInFlight()]);
    await openStatusPopover();

    await waitFor(() => expect(uploadCounts()[0]).toHaveTextContent('02'));
  });

  it('counts an upload the server has finished with separately', async () => {
    await openPageWithUploads([
      buildUploadInFlight(),
      buildUploadInFlight({ status: ENUMS.SUBMISSION_STATUS.ANALYZING }),
    ]);

    await openStatusPopover();

    await waitFor(() => expect(uploadCounts()[1]).toHaveTextContent('01'));
  });

  it('counts an upload the server gave up on as failed', async () => {
    await openPageWithUploads([
      buildUploadInFlight({ status: ENUMS.SUBMISSION_STATUS.VALIDATE_FAILED }),
    ]);

    await openStatusPopover();

    await waitFor(() => expect(uploadCounts()[2]).toHaveTextContent('01'));
  });

  it('lists what the server last said about each upload', async () => {
    await openPageWithUploads([buildUploadInFlight()]);
    await openStatusPopover();

    expect(await screen.findByText('Appknox Demo')).toBeInTheDocument();
    expect(rowStatus()).toHaveTextContent(akMT('inProgress'));
  });

  it('says an upload the server finished with is completed', async () => {
    await openPageWithUploads([buildUploadInFlight({ status: ENUMS.SUBMISSION_STATUS.ANALYZING })]);

    await openStatusPopover();

    await waitFor(() => expect(rowStatus()).toHaveTextContent(akMT('completed')));
  });

  it('says an upload the server gave up on failed, with its reason', async () => {
    await openPageWithUploads([
      buildUploadInFlight({
        status: ENUMS.SUBMISSION_STATUS.VALIDATE_FAILED,
        reason: 'The binary is not signed',
      }),
    ]);

    await openStatusPopover();

    await waitFor(() => expect(rowStatus()).toHaveTextContent(akMT('failed')));
    expect(screen.getByText('The binary is not signed')).toBeInTheDocument();
  });

  it('waits for the app the server is still reading out of the binary', async () => {
    await openPageWithUploads([buildUploadInFlight({ app_data: null })]);
    await openStatusPopover();

    await waitFor(() =>
      expect(document.querySelector('[data-test-upload-status-app-pending]')).toBeInTheDocument()
    );
  });

  it('names where the upload came from', async () => {
    await openPageWithUploads([buildUploadInFlight()]);
    await openStatusPopover();

    expect(await screen.findByText(akMT('viaSystem'))).toBeInTheDocument();
  });

  it('names a store link as where the upload came from', async () => {
    await openPageWithUploads([buildUploadInFlight({ url: 'https://play.google.com/an-app' })]);
    await openStatusPopover();

    expect(await screen.findByText(akMT('viaLink'))).toBeInTheDocument();
  });

  it('links back to the store listing a store upload came from', async () => {
    await openPageWithUploads([buildUploadInFlight({ url: 'https://play.google.com/an-app' })]);
    await openStatusPopover();

    const storeLink = await screen.findByText(akMT('viewStoreLink'));

    expect(storeLink.closest('a')).toHaveAttribute('href', 'https://play.google.com/an-app');
  });

  it('links back to nothing for an upload from this machine', async () => {
    await openPageWithUploads([buildUploadInFlight()]);
    await openStatusPopover();

    await screen.findByText(akMT('viaSystem'));

    expect(screen.queryByText(akMT('viewStoreLink'))).not.toBeInTheDocument();
  });

  it('renders created_on as a relative time', async () => {
    await openPageWithUploads([buildUploadInFlight()]);
    await openStatusPopover();

    expect(
      await screen.findByText(/ago$/, { selector: '[data-test-upload-status-time]' })
    ).toBeInTheDocument();
  });

  it('shows nothing in the bar when the account has nothing in flight', async () => {
    await openPageWithUploads([]);

    expect(screen.queryByRole('button', { name: akMT('uploadStatus') })).not.toBeInTheDocument();
  });

  it('shows the status the server pushes, without reading the list again', async () => {
    const submission = buildUploadInFlight();

    await openPageWithUploads([submission]);

    await openStatusPopover();
    await waitFor(() => expect(rowStatus()).toHaveTextContent(akMT('inProgress')));

    /* The list endpoint is taken away, so only the pushed record can move it on. */
    server.use(http.get(LIST_URL, () => HttpResponse.error()));

    serverSends(WEBSOCKET_EVENTS.modelUpdated, {
      model_name: 'submission',
      data: tagRecordForCaching('submission', {
        ...submission,
        status: ENUMS.SUBMISSION_STATUS.ANALYZING,
        status_humanized: 'Analyzing',
      }),
    });

    await waitFor(() => expect(rowStatus()).toHaveTextContent(akMT('completed')));
  });

  it('stays shut for an upload made somewhere else, even if it was last left open', async () => {
    /* As the popover is left after an upload here, before anything emptied the list. */
    uploadAppStore.setState({ shouldOpenUploadList: true });

    await openPageWithUploads([]);

    serverSends(WEBSOCKET_EVENTS.modelCreated, {
      model_name: 'submission',
      data: tagRecordForCaching('submission', buildUploadInFlight({ id: 7 })),
    });

    expect(await screen.findByRole('button', { name: akMT('uploadStatus') })).toBeInTheDocument();

    expect(document.querySelector('[data-test-upload-status-popover]')).not.toBeInTheDocument();
  });

  it('stays shut for an upload made somewhere else, which only the ring reports', async () => {
    await openPageWithUploads([]);

    serverSends(WEBSOCKET_EVENTS.modelCreated, {
      model_name: 'submission',
      data: tagRecordForCaching('submission', buildUploadInFlight({ id: 7 })),
    });

    /* The ring appears, because something is now in flight. */
    expect(await screen.findByRole('button', { name: akMT('uploadStatus') })).toBeInTheDocument();

    /* It does not open: this tab did not start it. */
    expect(document.querySelector('[data-test-upload-status-popover]')).not.toBeInTheDocument();
  });

  it('shows an upload the server created, without reading the list again', async () => {
    const existing = buildUploadInFlight();

    await openPageWithUploads([existing]);
    await openStatusPopover();

    await waitFor(() => expect(uploadCounts()[0]).toHaveTextContent('01'));

    /* The list endpoint is taken away, so only the pushed record can add a row. */
    server.use(http.get(LIST_URL, () => HttpResponse.error()));

    const created = buildUploadInFlight({
      id: existing.id + 1,
      app_data: buildSubmissionAppData({ name: 'Just Uploaded' }),
    });

    serverSends(WEBSOCKET_EVENTS.modelCreated, {
      model_name: 'submission',
      data: tagRecordForCaching('submission', created),
    });

    expect(await screen.findByText('Just Uploaded')).toBeInTheDocument();
    await waitFor(() => expect(uploadCounts()[0]).toHaveTextContent('02'));
  });

  it('shows an upload the server created even once it has moved past validating', async () => {
    await openPageWithUploads([buildUploadInFlight()]);
    await openStatusPopover();

    server.use(http.get(LIST_URL, () => HttpResponse.error()));

    serverSends(WEBSOCKET_EVENTS.modelCreated, {
      model_name: 'submission',
      data: tagRecordForCaching(
        'submission',
        buildUploadInFlight({
          id: 999,
          status: ENUMS.SUBMISSION_STATUS.DOWNLOAD_PREPARE,
          app_data: buildSubmissionAppData({ name: 'Still Downloading' }),
        })
      ),
    });

    expect(await screen.findByText('Still Downloading')).toBeInTheDocument();
  });

  it('shows an upload it already has only once', async () => {
    const existing = buildUploadInFlight();

    await openPageWithUploads([existing]);
    await openStatusPopover();

    await waitFor(() => expect(uploadCounts()[0]).toHaveTextContent('01'));

    serverSends(WEBSOCKET_EVENTS.modelCreated, {
      model_name: 'submission',
      data: tagRecordForCaching('submission', existing),
    });

    await waitFor(() => expect(uploadCounts()[0]).toHaveTextContent('01'));
  });

  it('keeps an upload the server has finished with when the list is read again', async () => {
    const completed = buildUploadInFlight({
      status: ENUMS.SUBMISSION_STATUS.ANALYZING,
      app_data: buildSubmissionAppData({ name: 'Already Done' }),
    });

    await openPageWithUploads([completed]);
    await openStatusPopover();

    expect(await screen.findByText('Already Done')).toBeInTheDocument();

    /* The server now reports only what is still validating, which this is not. */
    serverHasUploads([buildUploadInFlight()]);

    raiseWebsocketSignal('SubmissionCounter');

    await waitFor(() => expect(uploadCounts()[0]).toHaveTextContent('01'));

    expect(screen.getByText('Already Done')).toBeInTheDocument();
  });

  it('reads the list again when the server counts a new upload', async () => {
    const existing = buildUploadInFlight({ id: 1 });

    await openPageWithUploads([existing]);
    await openStatusPopover();

    await waitFor(() => expect(uploadCounts()[0]).toHaveTextContent('01'));

    serverHasUploads([existing, buildUploadInFlight({ id: 2 })]);

    raiseWebsocketSignal('SubmissionCounter');

    await waitFor(() => expect(uploadCounts()[0]).toHaveTextContent('02'));
  });

  describe('between the two queues an upload can be in', () => {
    const OFFENSIVE_SECURITY_ROUTE = '/dashboard/offensive-security';

    /** An offensive-security upload the server is still validating. */
    const buildOffsecUploadInFlight = (overrides = {}) =>
      buildUploadInFlight({ source: ENUMS.SUBMISSION_SOURCE.OFFSEC, ...overrides });

    /** Pushes an upload the server has just created. */
    const serverCreates = (submission: object) =>
      serverSends(WEBSOCKET_EVENTS.modelCreated, {
        model_name: 'submission',
        data: tagRecordForCaching('submission', submission),
      });

    it('omits a pushed offensive security upload from the dashboard list', async () => {
      const existing = buildUploadInFlight();

      await openPageWithUploads([existing]);
      await openStatusPopover();

      await waitFor(() => expect(uploadCounts()[0]).toHaveTextContent('01'));

      /* The list endpoint is taken away, so only a pushed record can add a row. */
      server.use(http.get(LIST_URL, () => HttpResponse.error()));

      serverCreates(
        buildOffsecUploadInFlight({
          id: existing.id + 1,
          app_data: buildSubmissionAppData({ name: 'An Attack Run' }),
        })
      );

      /*
        Pushed alongside it and belonging to this list, so its row arriving is
        what says the other one was left out rather than still on its way.
      */
      serverCreates(
        buildUploadInFlight({
          id: existing.id + 2,
          app_data: buildSubmissionAppData({ name: 'A Scan Upload' }),
        })
      );

      expect(await screen.findByText('A Scan Upload')).toBeInTheDocument();

      expect(screen.queryByText('An Attack Run')).not.toBeInTheDocument();
      expect(uploadCounts()[0]).toHaveTextContent('02');
    });

    it('adds a pushed offensive security upload to the offensive security list', async () => {
      mockOrganizationFeatures({ offensive_security: true });

      const existing = buildOffsecUploadInFlight();

      await openPageWithUploads([existing], OFFENSIVE_SECURITY_ROUTE);
      await openStatusPopover();

      await waitFor(() => expect(uploadCounts()[0]).toHaveTextContent('01'));

      server.use(http.get(LIST_URL, () => HttpResponse.error()));

      serverCreates(
        buildOffsecUploadInFlight({
          id: existing.id + 1,
          app_data: buildSubmissionAppData({ name: 'An Attack Run' }),
        })
      );

      expect(await screen.findByText('An Attack Run')).toBeInTheDocument();
      await waitFor(() => expect(uploadCounts()[0]).toHaveTextContent('02'));
    });

    it('omits a pushed dashboard upload from the offensive security list', async () => {
      mockOrganizationFeatures({ offensive_security: true });

      const existing = buildOffsecUploadInFlight();

      await openPageWithUploads([existing], OFFENSIVE_SECURITY_ROUTE);
      await openStatusPopover();

      await waitFor(() => expect(uploadCounts()[0]).toHaveTextContent('01'));

      server.use(http.get(LIST_URL, () => HttpResponse.error()));

      serverCreates(
        buildUploadInFlight({
          id: existing.id + 1,
          app_data: buildSubmissionAppData({ name: 'A Scan Upload' }),
        })
      );

      serverCreates(
        buildOffsecUploadInFlight({
          id: existing.id + 2,
          app_data: buildSubmissionAppData({ name: 'An Attack Run' }),
        })
      );

      expect(await screen.findByText('An Attack Run')).toBeInTheDocument();

      expect(screen.queryByText('A Scan Upload')).not.toBeInTheDocument();
      expect(uploadCounts()[0]).toHaveTextContent('02');
    });
  });
});
