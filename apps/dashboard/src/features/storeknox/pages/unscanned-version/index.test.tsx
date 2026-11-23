import { faker } from '@faker-js/faker';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import dayjs from 'dayjs';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { tagRecordForCaching } from '@irene/api/normalization';
import { FileEndpoints } from '@irene/api/services/file';
import { StoreknoxEndpoints } from '@irene/api/services/storeknox';
import { SubmissionEndpoints } from '@irene/api/services/submission';
import { COUNTRY_NAMES_MAP, HTTP_STATUS_CODES } from '@irene/constants';
import { ENUMS } from '@irene/enums';
import { formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { WEBSOCKET_EVENTS } from '@irene/websocket/testing';

import {
  buildSkAppVersion,
  buildSkCoreFile,
  buildSkInventoryApp,
  buildSkStoreInstance,
  buildSubmission,
} from '@tests/factories';

import {
  mockSkAppVersions,
  mockSkInventoryApp,
  mockSkSubscription,
  mockStoreknoxOrganization,
  signInToStoreknox,
} from '@tests/storeknox';

import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';
import { websocketTransport } from '@tests/setup';

const versionsOf = (id: number) => `/dashboard/storeknox/inventory-details/${id}/unscanned-version`;
const needsAction = { store_monitoring_status: ENUMS.SK_APP_MONITORING_STATUS.ACTION_NEEDED };

describe('an app’s unscanned versions', () => {
  beforeEach(() => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();
    mockSkSubscription();
  });

  it('sends the visitor back to the app while store monitoring gathers results', async () => {
    const app = buildSkInventoryApp({
      store_monitoring_status: ENUMS.SK_APP_MONITORING_STATUS.INITIALIZING,
    });

    mockSkInventoryApp(app);

    const { router } = await renderAtRoute(versionsOf(app.id));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        `/dashboard/storeknox/inventory-details/${app.id}`
      )
    );
  });

  it('lists the store’s latest versions with where each is listed', async () => {
    const app = buildSkInventoryApp(needsAction);

    const countryCode = faker.helpers.objectKey(COUNTRY_NAMES_MAP);
    const instance = buildSkStoreInstance({ country_code: countryCode });

    const version = buildSkAppVersion({ sk_app: app.id, sk_store_instances: [instance] });

    mockSkInventoryApp(app);
    mockSkAppVersions(app.id, { latest: [version] });

    await renderAtRoute(versionsOf(app.id));

    expect(await screen.findByText(version.version)).toBeInTheDocument();
    expect(screen.getByText(akMT('notScanned'))).toBeInTheDocument();

    const country = document.querySelector<HTMLElement>(
      `[data-test-sk-country="${instance.country_code}"]`
    );

    expect(country).toHaveTextContent(instance.country_code);

    if (country) {
      await userEvent.hover(country);
    }

    expect(
      await screen.findByRole('tooltip', { name: COUNTRY_NAMES_MAP[countryCode] })
    ).toBeInTheDocument();

    expect(screen.getByRole('tab', { name: akMT('storeknox.monitoringDetails') })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('says so when the store lists no versions', async () => {
    const app = buildSkInventoryApp(needsAction);

    mockSkInventoryApp(app);
    mockSkAppVersions(app.id, { latest: [] });

    await renderAtRoute(versionsOf(app.id));

    expect(
      await screen.findByText(akMT('storeknox.monitoringDetailsTableEmpty'))
    ).toBeInTheDocument();
  });

  it('opens the overview on the last scanned version', async () => {
    const file = buildSkCoreFile();
    const app = buildSkInventoryApp({ ...needsAction, core_project_latest_version: file.id });

    mockSkInventoryApp(app);
    mockSkAppVersions(app.id, { latest: [] });

    server.use(
      http.get(buildAPITestURL(FileEndpoints.detail(file.id)), () => HttpResponse.json(file))
    );

    await renderAtRoute(versionsOf(app.id));

    await userEvent.click(
      await screen.findByRole('button', { name: akMT('storeknox.storeMonitoringOverview') })
    );

    expect(await screen.findByText(file.version)).toBeInTheDocument();
    expect(screen.getByText(akMT('active'))).toBeInTheDocument();
  });

  it('pages through the history, with when each version was found', async () => {
    const app = buildSkInventoryApp(needsAction);
    const version = buildSkAppVersion({ sk_app: app.id, is_latest: false });

    mockSkInventoryApp(app);
    mockSkAppVersions(app.id, { history: [version], historyCount: 12 });

    await renderAtRoute(`${versionsOf(app.id)}/history`);

    expect(
      await screen.findByText(formatDateTime(version.created_on, 'mediumDate'))
    ).toBeInTheDocument();

    expect(screen.getByRole('button', { name: akMT('next') })).toBeEnabled();
  });

  it('reads a scanned version as needing nothing, with a link to its file', async () => {
    const app = buildSkInventoryApp(needsAction);
    const file = buildSkCoreFile();
    const version = buildSkAppVersion({ sk_app: app.id, file: file.id });

    mockSkInventoryApp(app);
    mockSkAppVersions(app.id, { latest: [version] });

    server.use(
      http.get(buildAPITestURL(FileEndpoints.detail(file.id)), () => HttpResponse.json(file))
    );

    await renderAtRoute(versionsOf(app.id));

    expect(await screen.findByText(akMT('noActionRequired'))).toBeInTheDocument();

    expect(screen.getByRole('link', { name: `${akMT('fileID')} - ${file.id}` })).toHaveAttribute(
      'href',
      `/dashboard/file/${file.id}`
    );
  });

  it('starts an upload of an unscanned version and follows it', async () => {
    const app = buildSkInventoryApp(needsAction);
    const version = buildSkAppVersion({ sk_app: app.id });
    const submission = buildSubmission({ status: ENUMS.SUBMISSION_STATUS.STORE_DOWNLOADING });

    mockSkInventoryApp(app);
    mockSkAppVersions(app.id, { latest: [version] });

    server.use(
      http.get(buildAPITestURL(StoreknoxEndpoints.appVersion(version.id)), () =>
        HttpResponse.json(version)
      ),
      http.post(buildAPITestURL(StoreknoxEndpoints.appVersionUpload(version.id)), () =>
        HttpResponse.json({ id: submission.id, url: '', status: submission.status })
      ),
      http.get(buildAPITestURL(SubmissionEndpoints.detail(submission.id)), () =>
        HttpResponse.json(submission)
      )
    );

    await renderAtRoute(versionsOf(app.id));

    await userEvent.click(
      await screen.findByRole('button', { name: akMT('storeknox.initiateUpload') })
    );

    expect(await screen.findByText(`${akMT('uploading')}...`)).toBeInTheDocument();
  });

  it('shows a failed upload’s reason in its details, with a retry', async () => {
    const app = buildSkInventoryApp(needsAction);

    const submission = buildSubmission({
      status: ENUMS.SUBMISSION_STATUS.STORE_DOWNLOAD_FAILED,
      reason: 'Version unavailable in this region',
    });

    const version = buildSkAppVersion({ sk_app: app.id, upload_submission: submission.id });

    mockSkInventoryApp(app);
    mockSkAppVersions(app.id, { latest: [version] });

    server.use(
      http.get(buildAPITestURL(SubmissionEndpoints.detail(submission.id)), () =>
        HttpResponse.json(submission)
      )
    );

    await renderAtRoute(versionsOf(app.id));

    await userEvent.click(
      await screen.findByRole('button', { name: akMT('storeknox.checkDetails') })
    );

    const dialog = await screen.findByRole('dialog');

    expect(dialog).toHaveTextContent(submission.reason);
    expect(dialog).toHaveTextContent(akMT('storeknox.initiateUploadMessages.uploadIncomplete'));
  });

  it('holds back uploads for an archived app', async () => {
    const app = buildSkInventoryApp({
      ...needsAction,
      app_status: ENUMS.SK_APP_STATUS.ARCHIVED,
      archived_on: dayjs().subtract(1, 'day').toISOString(),
    });

    const version = buildSkAppVersion({ sk_app: app.id });

    mockSkInventoryApp(app);
    mockSkAppVersions(app.id, { latest: [version] });

    await renderAtRoute(versionsOf(app.id));

    expect(
      await screen.findByRole('button', { name: akMT('storeknox.initiateUpload') })
    ).toBeDisabled();
  });
});

describe('an unscanned version’s upload, beyond the first attempt', () => {
  beforeEach(() => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();
    mockSkSubscription();
  });

  it('refuses an upload another member started, and opens its details', async () => {
    const app = buildSkInventoryApp(needsAction);
    const version = buildSkAppVersion({ sk_app: app.id });

    mockSkInventoryApp(app);
    mockSkAppVersions(app.id, { latest: [version] });

    server.use(
      http.get(buildAPITestURL(StoreknoxEndpoints.appVersion(version.id)), () =>
        HttpResponse.json({ ...version, can_initiate_upload: false })
      )
    );

    await renderAtRoute(versionsOf(app.id));

    await userEvent.click(
      await screen.findByRole('button', { name: akMT('storeknox.initiateUpload') })
    );

    expect(
      await screen.findByText(
        akMT('storeknox.initiateUploadMessages.cannotIntiateUploadForVersion')
      )
    ).toBeInTheDocument();

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('holds the retry back once the reloaded version says it cannot upload', async () => {
    const app = buildSkInventoryApp(needsAction);
    const version = buildSkAppVersion({ sk_app: app.id });
    const requested: string[] = [];

    const record = ({ request }: { request: Request }) => {
      requested.push(new URL(request.url).pathname);
    };

    mockSkInventoryApp(app);
    mockSkAppVersions(app.id, { latest: [version] });

    server.use(
      http.get(buildAPITestURL(StoreknoxEndpoints.appVersion(version.id)), () =>
        HttpResponse.json({ ...version, can_initiate_upload: false })
      )
    );

    server.events.on('request:start', record);

    try {
      await renderAtRoute(versionsOf(app.id));

      await userEvent.click(
        await screen.findByRole('button', { name: akMT('storeknox.initiateUpload') })
      );

      expect(
        await within(await screen.findByRole('dialog')).findByRole('button', {
          name: akMT('storeknox.retryUpload'),
        })
      ).toBeDisabled();
    } finally {
      server.events.removeListener('request:start', record);
    }

    /* The version points at no upload, so there is none to read again. */
    expect(requested).not.toContain(`/${SubmissionEndpoints.detail('')}`);
  });

  it('shows the server’s note on an upload the account cannot see', async () => {
    const app = buildSkInventoryApp(needsAction);
    const submission = buildSubmission();
    const errorMessage = faker.lorem.sentence();

    const version = buildSkAppVersion({
      sk_app: app.id,
      can_initiate_upload: false,
      upload_submission: submission.id,
      submission_error_message: errorMessage,
    });

    mockSkInventoryApp(app);
    mockSkAppVersions(app.id, { latest: [version] });

    server.use(
      http.get(buildAPITestURL(SubmissionEndpoints.detail(submission.id)), () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.NOT_FOUND })
      )
    );

    await renderAtRoute(versionsOf(app.id));

    await userEvent.click(await screen.findByRole('button', { name: akMT('details') }));

    expect(await screen.findByRole('dialog')).toHaveTextContent(errorMessage);
  });

  it('reads someone else’s upload as started, for an account that cannot see it', async () => {
    const app = buildSkInventoryApp(needsAction);

    const version = buildSkAppVersion({
      sk_app: app.id,
      can_initiate_upload: false,
      upload_submission: 77,
    });

    mockSkInventoryApp(app);
    mockSkAppVersions(app.id, { latest: [version] });

    server.use(
      http.get(buildAPITestURL(SubmissionEndpoints.detail(77)), () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.NOT_FOUND })
      )
    );

    await renderAtRoute(versionsOf(app.id));

    expect(
      await screen.findByText(akMT('storeknox.initiateUploadMessages.uploadInitiated'))
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: akMT('details') }));

    expect(
      await screen.findByRole('button', { name: akMT('storeknox.retryUpload') })
    ).toBeDisabled();
  });

  it('reads an upload that reached Appknox as completed', async () => {
    const app = buildSkInventoryApp(needsAction);
    const submission = buildSubmission({ status: ENUMS.SUBMISSION_STATUS.ANALYZING });
    const version = buildSkAppVersion({ sk_app: app.id, upload_submission: submission.id });

    mockSkInventoryApp(app);
    mockSkAppVersions(app.id, { latest: [version] });

    server.use(
      http.get(buildAPITestURL(SubmissionEndpoints.detail(submission.id)), () =>
        HttpResponse.json(submission)
      )
    );

    await renderAtRoute(versionsOf(app.id));

    expect(await screen.findByText(akMT('completed'))).toBeInTheDocument();
  });

  it('says the history is empty, and marks a version listed nowhere', async () => {
    const app = buildSkInventoryApp(needsAction);
    const unlisted = buildSkAppVersion({ sk_app: app.id, sk_store_instances: [] });

    mockSkInventoryApp(app);
    mockSkAppVersions(app.id, { latest: [unlisted], history: [] });

    const { router } = await renderAtRoute(versionsOf(app.id));

    expect(await screen.findByText('-')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: akMT('storeknox.monitoringHistory') }));

    expect(
      await screen.findByText(akMT('storeknox.monitoringHistoryTableEmpty'))
    ).toBeInTheDocument();

    expect(router.state.location.pathname).toBe(`${versionsOf(app.id)}/history`);
  });

  it('keeps a decommissioned app’s history viewable, with uploads off', async () => {
    const app = buildSkInventoryApp({
      app_status: ENUMS.SK_APP_STATUS.DECOMMISSIONED,
      store_monitoring_status: ENUMS.SK_APP_MONITORING_STATUS.DISABLED,
      has_store_monitoring_data: true,
      monitoring_enabled: false,
    });

    const version = buildSkAppVersion({ sk_app: app.id });

    mockSkInventoryApp(app);
    mockSkAppVersions(app.id, { latest: [version] });

    await renderAtRoute(versionsOf(app.id));

    expect(
      await screen.findByRole('button', { name: akMT('storeknox.initiateUpload') })
    ).toBeDisabled();

    await userEvent.click(
      screen.getByRole('button', { name: akMT('storeknox.storeMonitoringOverview') })
    );

    expect(await screen.findByText(akMT('storeknox.decommissioned'))).toBeInTheDocument();
  });
});

describe('an unscanned version as it is scanned', () => {
  beforeEach(() => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();
    mockSkSubscription();
  });

  it('marks a version scanned after it was found, and names an unknown store by its code', async () => {
    const app = buildSkInventoryApp(needsAction);
    const file = buildSkCoreFile();
    const createdOn = dayjs().subtract(1, 'month');

    /* ZZ is a user-assigned ISO code, so no store is named after it. */
    const unknownStore = buildSkStoreInstance({ country_code: 'ZZ' });

    const version = buildSkAppVersion({
      sk_app: app.id,
      file: file.id,
      created_on: createdOn.toISOString(),
      file_created_on: createdOn.add(1, 'week').toISOString(),
      sk_store_instances: [unknownStore],
    });

    mockSkInventoryApp(app);
    mockSkAppVersions(app.id, { latest: [version] });

    server.use(
      http.get(buildAPITestURL(FileEndpoints.detail(file.id)), () => HttpResponse.json(file))
    );

    await renderAtRoute(versionsOf(app.id));

    expect(await screen.findByText(akMT('scanned'))).toBeInTheDocument();
    expect(screen.getByText(akMT('notScanned'))).toBeInTheDocument();

    const country = document.querySelector<HTMLElement>(
      `[data-test-sk-country="${unknownStore.country_code}"]`
    );

    expect(country).toHaveTextContent(unknownStore.country_code);

    if (country) {
      await userEvent.hover(country);
    }

    expect(
      await screen.findByRole('tooltip', { name: unknownStore.country_code })
    ).toBeInTheDocument();
  });

  it('follows a pushed status until the upload reaches Appknox', async () => {
    const app = buildSkInventoryApp(needsAction);
    const submission = buildSubmission({ status: ENUMS.SUBMISSION_STATUS.STORE_UPLOAD_FAILED });
    const version = buildSkAppVersion({ sk_app: app.id, upload_submission: submission.id });

    mockSkInventoryApp(app);
    mockSkAppVersions(app.id, { latest: [version] });

    server.use(
      http.get(buildAPITestURL(SubmissionEndpoints.detail(submission.id)), () =>
        HttpResponse.json(submission)
      )
    );

    await renderAtRoute(versionsOf(app.id));

    const checkDetails = await screen.findByRole('button', {
      name: akMT('storeknox.checkDetails'),
    });

    await userEvent.click(checkDetails);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    act(() => {
      websocketTransport.emit(WEBSOCKET_EVENTS.modelUpdated, {
        model_name: 'submission',
        data: tagRecordForCaching('submission', {
          ...submission,
          status: ENUMS.SUBMISSION_STATUS.ANALYZING,
        }),
      });
    });

    expect(await screen.findByText(akMT('completed'))).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
