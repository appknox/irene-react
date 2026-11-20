import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { FileEndpoints } from '@irene/api/services/file';
import { OrganizationEndpoints } from '@irene/api/services/organization';
import { StoreknoxEndpoints } from '@irene/api/services/storeknox';
import { SubmissionEndpoints } from '@irene/api/services/submission';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';

import {
  buildOrganization,
  buildSkCoreFile,
  buildSkFileRisk,
  buildSkInventoryApp,
  buildSkStoreInstance,
  buildSubmission,
} from '@tests/factories';

import {
  mockSkInventoryApp,
  mockSkSubscription,
  mockStoreknoxOrganization,
  signInToStoreknox,
} from '@tests/storeknox';

import { skSubmissionProgress } from '@/features/storeknox/utils/submission';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const detailsOf = (id: number) => `/dashboard/storeknox/inventory-details/${id}`;

describe('an app’s checks and scan', () => {
  beforeEach(() => {
    signInToStoreknox({ is_owner: true });
    mockSkSubscription();
  });

  it('counts the checks that need action and links to the unscanned versions', async () => {
    mockStoreknoxOrganization();

    const app = buildSkInventoryApp({
      store_monitoring_status: ENUMS.SK_APP_MONITORING_STATUS.ACTION_NEEDED,
    });

    mockSkInventoryApp(app);

    await renderAtRoute(detailsOf(app.id));

    expect(await screen.findByText(`${akMT('storeknox.actionNeeded')} (1)`)).toBeInTheDocument();

    expect(screen.getByRole('link', { name: akMT('storeknox.unscannedVersion') })).toHaveAttribute(
      'href',
      `/dashboard/storeknox/inventory-details/${app.id}/unscanned-version`
    );
  });

  it('offers brand abuse and malware as features on sale when the organization lacks them', async () => {
    mockStoreknoxOrganization();

    const app = buildSkInventoryApp();

    mockSkInventoryApp(app);

    await renderAtRoute(detailsOf(app.id));

    expect(
      await screen.findByRole('link', { name: akMT('storeknox.malwareDetected') })
    ).toHaveAttribute('href', `/dashboard/storeknox/inventory-details/${app.id}/malware-detected`);

    expect(screen.getByRole('link', { name: akMT('storeknox.fakeAppsTitle') })).toHaveAttribute(
      'href',
      `/dashboard/storeknox/inventory-details/${app.id}/brand-abuse`
    );
  });

  it('waits on results while store monitoring gathers its first ones', async () => {
    mockStoreknoxOrganization();

    const app = buildSkInventoryApp({
      store_monitoring_status: ENUMS.SK_APP_MONITORING_STATUS.INITIALIZING,
    });

    mockSkInventoryApp(app);

    await renderAtRoute(detailsOf(app.id));

    expect(await screen.findByText(akMT('storeknox.monitoringResultsPending'))).toBeInTheDocument();
  });

  it('lists who makes the app', async () => {
    mockStoreknoxOrganization();

    const app = buildSkInventoryApp();

    mockSkInventoryApp(app);

    await renderAtRoute(detailsOf(app.id));

    const row = (await screen.findByText(akMT('emailId'))).closest('[data-test-sk-info-row]');

    expect(within(row as HTMLElement).getByText(app.app_metadata.dev_email)).toBeInTheDocument();
  });

  it('shows the latest file’s finding counts and links to it', async () => {
    mockStoreknoxOrganization();

    const file = buildSkCoreFile();
    const risk = buildSkFileRisk({ risk_count_critical: 7 });
    const app = buildSkInventoryApp({ core_project: 4, core_project_latest_version: file.id });

    mockSkInventoryApp(app);

    server.use(
      http.get(buildAPITestURL(FileEndpoints.detail(file.id)), () => HttpResponse.json(file)),
      http.get(buildAPITestURL(FileEndpoints.risk(file.id)), () => HttpResponse.json(risk))
    );

    await renderAtRoute(detailsOf(app.id));

    expect(await screen.findByRole('link', { name: String(file.id) })).toHaveAttribute(
      'href',
      `/dashboard/file/${file.id}`
    );

    expect(await screen.findByText(file.version)).toBeInTheDocument();

    const critical = document.querySelector('[data-test-sk-risk="critical"]') as HTMLElement;

    await waitFor(() => expect(critical).toHaveTextContent(String(risk.risk_count_critical)));
  });

  it('says the account cannot see the latest file', async () => {
    mockStoreknoxOrganization();

    const app = buildSkInventoryApp({ core_project: 4, core_project_latest_version: 99 });

    mockSkInventoryApp(app);

    server.use(
      http.get(buildAPITestURL(FileEndpoints.detail(99)), () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.NOT_FOUND })
      )
    );

    await renderAtRoute(detailsOf(app.id));

    expect(
      await screen.findByText(akMT('storeknox.noAcessToVAResultsHeaderText'))
    ).toBeInTheDocument();
  });

  it('shows an upload in flight with how far it has got', async () => {
    mockStoreknoxOrganization();

    const submission = buildSubmission({ status: ENUMS.SUBMISSION_STATUS.STORE_DOWNLOADING });
    const app = buildSkInventoryApp({ upload_submission: submission.id });

    mockSkInventoryApp(app);

    server.use(
      http.get(buildAPITestURL(SubmissionEndpoints.detail(submission.id)), () =>
        HttpResponse.json(submission)
      )
    );

    await renderAtRoute(detailsOf(app.id));

    expect(await screen.findByText(`${skSubmissionProgress(submission)}%`)).toBeInTheDocument();
  });

  it('starts an upload of an app not on Appknox and follows it', async () => {
    mockStoreknoxOrganization();

    const app = buildSkInventoryApp();
    const submission = buildSubmission({ status: ENUMS.SUBMISSION_STATUS.STORE_VALIDATING_URL });

    mockSkInventoryApp(app);

    server.use(
      http.post(buildAPITestURL(StoreknoxEndpoints.appUpload(app.id)), () =>
        HttpResponse.json({ id: submission.id, url: '', status: submission.status })
      ),
      http.get(buildAPITestURL(SubmissionEndpoints.detail(submission.id)), () =>
        HttpResponse.json(submission)
      )
    );

    await renderAtRoute(detailsOf(app.id));

    expect(await screen.findByText(akMT('storeknox.appNotInAppknoxHeader'))).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: akMT('storeknox.initiateUpload') }));

    expect(await screen.findByText(`${skSubmissionProgress(submission)}%`)).toBeInTheDocument();
  });

  it('refuses an upload another member has already started', async () => {
    mockStoreknoxOrganization();

    const app = buildSkInventoryApp();
    let reloads = 0;

    server.use(
      http.get(buildAPITestURL(StoreknoxEndpoints.appDetail(app.id)), () => {
        reloads += 1;

        return HttpResponse.json(reloads > 1 ? { ...app, can_initiate_upload: false } : app);
      })
    );

    await renderAtRoute(detailsOf(app.id));

    await userEvent.click(
      await screen.findByRole('button', { name: akMT('storeknox.initiateUpload') })
    );

    expect(
      await screen.findByText(akMT('storeknox.initiateUploadMessages.cannotIntiateUpload'))
    ).toBeInTheDocument();
  });

  it('offers a retry with the reason when the last upload failed', async () => {
    mockStoreknoxOrganization();

    const submission = buildSubmission({
      status: ENUMS.SUBMISSION_STATUS.STORE_UPLOAD_FAILED,
      reason: 'The store link has expired',
    });

    const app = buildSkInventoryApp({ upload_submission: submission.id });

    mockSkInventoryApp(app);

    server.use(
      http.get(buildAPITestURL(SubmissionEndpoints.detail(submission.id)), () =>
        HttpResponse.json(submission)
      )
    );

    await renderAtRoute(detailsOf(app.id));

    expect(await screen.findByText(submission.reason)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: akMT('storeknox.retryUpload') })).toBeEnabled();
  });

  it('shows only the text of the server’s error message', async () => {
    mockStoreknoxOrganization();

    const app = buildSkInventoryApp({
      can_initiate_upload: false,
      submission_error_message: '<b>Namespace</b> awaiting approval',
      sk_organization: buildSkStoreInstance().id,
    });

    mockSkInventoryApp(app);

    await renderAtRoute(detailsOf(app.id));

    expect(await screen.findByText('Namespace awaiting approval')).toBeInTheDocument();
  });
});

describe('the checks an organization has not bought', () => {
  it('says malware detection is unavailable', async () => {
    signInToStoreknox();
    mockStoreknoxOrganization();
    mockSkSubscription();

    const app = buildSkInventoryApp();

    mockSkInventoryApp(app);

    await renderAtRoute(`${detailsOf(app.id)}/malware-detected`);

    expect(
      await screen.findByText(akMT('storeknox.malwareDetectedFeatureUnavailableHeader'))
    ).toBeInTheDocument();

    expect(document.querySelector('[data-test-sk-details-page-tag]')).toHaveTextContent(
      akMT('storeknox.malwareDetected')
    );
  });

  it('says brand abuse detection is unavailable', async () => {
    signInToStoreknox();
    mockStoreknoxOrganization();
    mockSkSubscription();

    const app = buildSkInventoryApp();

    mockSkInventoryApp(app);

    await renderAtRoute(`${detailsOf(app.id)}/brand-abuse`);

    expect(
      await screen.findByText(akMT('storeknox.brandAbuseFeatureUnavailableHeader'))
    ).toBeInTheDocument();
  });
});

describe('an app’s checks in other states', () => {
  beforeEach(() => {
    signInToStoreknox({ is_owner: true });
    mockSkSubscription();
  });

  const fakeAppDetection = {
    sk_features: {
      inventory: true,
      drift_detection: false,
      fake_app_detection: true,
      use_ai_validation: false,
      third_party_scanning: false,
    },
  };

  it("opens the app's own fake-app list from the brand abuse check", async () => {
    mockStoreknoxOrganization(fakeAppDetection);

    const app = buildSkInventoryApp({
      fake_app_detection_status: ENUMS.SK_FAKE_APP_DETECTION_STATUS.HAS_RESULTS,
    });

    mockSkInventoryApp(app);

    await renderAtRoute(detailsOf(app.id));

    expect(await screen.findByText(`${akMT('storeknox.actionNeeded')} (1)`)).toBeInTheDocument();

    const fakeApps = document.querySelector('[data-test-sk-action="brand-abuse"]') as HTMLElement;

    expect(within(fakeApps).getByRole('link')).toHaveAttribute(
      'href',
      `/dashboard/storeknox/fake-apps/${app.id}`
    );
  });

  it('holds back a check that has no results to open while monitoring is off', async () => {
    mockStoreknoxOrganization(fakeAppDetection);

    const app = buildSkInventoryApp({
      monitoring_enabled: false,
      has_store_monitoring_data: true,
      has_fake_app_detection_data: false,
    });

    mockSkInventoryApp(app);

    await renderAtRoute(detailsOf(app.id));

    await screen.findByRole('link', { name: akMT('storeknox.unscannedVersion') });

    const fakeApps = document.querySelector('[data-test-sk-action="brand-abuse"]') as HTMLElement;

    expect(within(fakeApps).queryByRole('link')).not.toBeInTheDocument();
  });

  it('asks for monitoring to be turned on when it is off with nothing to show', async () => {
    mockStoreknoxOrganization(fakeAppDetection);

    const app = buildSkInventoryApp({
      monitoring_enabled: false,
      has_store_monitoring_data: false,
      has_fake_app_detection_data: false,
    });

    mockSkInventoryApp(app);

    await renderAtRoute(detailsOf(app.id));

    expect(await screen.findByText(akMT('storeknox.enableMonitoringForApp'))).toBeInTheDocument();
  });

  it('says a decommissioned app with nothing to show has gone', async () => {
    mockStoreknoxOrganization();

    const app = buildSkInventoryApp({
      app_status: ENUMS.SK_APP_STATUS.DECOMMISSIONED,
      monitoring_enabled: false,
      has_store_monitoring_data: false,
    });

    mockSkInventoryApp(app);

    await renderAtRoute(detailsOf(app.id));

    expect(await screen.findByText(akMT('storeknox.appDecommissionedHeading'))).toBeInTheDocument();
  });

  it('hides the checks on sale from an organization that hides what it has not bought', async () => {
    mockStoreknoxOrganization();

    const organization = buildOrganization();

    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.list()), () =>
        HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              ...organization,
              hide_upsell_features: true,
              features: { ...organization.features, storeknox: true },
            },
          ],
        })
      )
    );

    const app = buildSkInventoryApp();

    mockSkInventoryApp(app);

    await renderAtRoute(detailsOf(app.id));

    await screen.findByRole('link', { name: akMT('storeknox.unscannedVersion') });

    expect(
      screen.queryByRole('link', { name: akMT('storeknox.malwareDetected') })
    ).not.toBeInTheDocument();
  });

  it('says why an upload would not start', async () => {
    mockStoreknoxOrganization();

    const app = buildSkInventoryApp();
    const reason = 'Store unreachable';

    mockSkInventoryApp(app);

    server.use(
      http.post(buildAPITestURL(StoreknoxEndpoints.appUpload(app.id)), () =>
        HttpResponse.json({ detail: reason }, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    await renderAtRoute(detailsOf(app.id));

    await userEvent.click(
      await screen.findByRole('button', { name: akMT('storeknox.initiateUpload') })
    );

    expect(await screen.findByText(reason)).toBeInTheDocument();
  });

  it('points an owner at the namespaces while someone else’s upload waits', async () => {
    mockStoreknoxOrganization();

    const app = buildSkInventoryApp({ can_initiate_upload: false, upload_submission: 51 });

    mockSkInventoryApp(app);

    server.use(
      http.get(buildAPITestURL(SubmissionEndpoints.detail(51)), () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.NOT_FOUND })
      )
    );

    await renderAtRoute(detailsOf(app.id));

    expect(
      await screen.findByRole('link', { name: akMT('notificationModule.viewNamespaces') })
    ).toHaveAttribute('href', '/dashboard/organization/namespaces');
  });
});

describe('an upload the server has not started', () => {
  it('shows it at nought percent', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();
    mockSkSubscription();

    const submission = buildSubmission({ status: ENUMS.SUBMISSION_STATUS.STORE_NOT_STARTED });
    const app = buildSkInventoryApp({ upload_submission: submission.id });

    mockSkInventoryApp(app);

    server.use(
      http.get(buildAPITestURL(SubmissionEndpoints.detail(submission.id)), () =>
        HttpResponse.json(submission)
      )
    );

    await renderAtRoute(detailsOf(app.id));

    /* A stage with no percentage of its own draws the bar empty. */
    expect(
      await screen.findByText(`${skSubmissionProgress(submission) ?? 0}%`)
    ).toBeInTheDocument();
  });
});

describe('a decommissioned app’s checks with partial results', () => {
  const withFakeAppDetection = {
    sk_features: {
      inventory: true,
      drift_detection: false,
      fake_app_detection: true,
      use_ai_validation: false,
      third_party_scanning: false,
    },
  };

  beforeEach(() => {
    signInToStoreknox({ is_owner: true });
    mockSkSubscription();
    mockStoreknoxOrganization(withFakeAppDetection);
  });

  it('holds back the unscanned versions of a gone app with no store results', async () => {
    const app = buildSkInventoryApp({
      app_status: ENUMS.SK_APP_STATUS.DECOMMISSIONED,
      monitoring_enabled: false,
      has_store_monitoring_data: false,
      has_fake_app_detection_data: true,
    });

    mockSkInventoryApp(app);

    await renderAtRoute(detailsOf(app.id));

    const unscanned = await waitFor(() => {
      const element = document.querySelector('[data-test-sk-action="unscanned-version"]');

      expect(element).toBeInTheDocument();

      return element as HTMLElement;
    });

    expect(within(unscanned).queryByRole('link')).not.toBeInTheDocument();
  });

  it('holds back the fake apps of a gone app with no detection results', async () => {
    const app = buildSkInventoryApp({
      app_status: ENUMS.SK_APP_STATUS.DECOMMISSIONED,
      monitoring_enabled: false,
      has_store_monitoring_data: true,
      has_fake_app_detection_data: false,
    });

    mockSkInventoryApp(app);

    await renderAtRoute(detailsOf(app.id));

    await screen.findByRole('link', { name: akMT('storeknox.unscannedVersion') });

    const fakeApps = document.querySelector('[data-test-sk-action="brand-abuse"]') as HTMLElement;

    expect(within(fakeApps).queryByRole('link')).not.toBeInTheDocument();
  });
});

describe('an app whose checks are still gathering results', () => {
  const withFakeAppDetection = {
    sk_features: {
      inventory: true,
      drift_detection: false,
      fake_app_detection: true,
      use_ai_validation: false,
      third_party_scanning: false,
    },
  };

  beforeEach(() => {
    signInToStoreknox({ is_owner: true });
    mockSkSubscription();
    mockStoreknoxOrganization(withFakeAppDetection);
  });

  it('spins the unscanned versions while store monitoring initializes', async () => {
    const app = buildSkInventoryApp({
      store_monitoring_status: ENUMS.SK_APP_MONITORING_STATUS.INITIALIZING,
    });

    mockSkInventoryApp(app);

    await renderAtRoute(detailsOf(app.id));

    const unscanned = await waitFor(() => {
      const element = document.querySelector('[data-test-sk-action="unscanned-version"]');

      expect(element).toBeInTheDocument();

      return element as HTMLElement;
    });

    expect(unscanned.querySelector('[data-test-sk-action-loading]')).toBeInTheDocument();
  });

  it('spins the fake apps while detection initializes', async () => {
    const app = buildSkInventoryApp({
      fake_app_detection_status: ENUMS.SK_FAKE_APP_DETECTION_STATUS.INITIALIZING,
    });

    mockSkInventoryApp(app);

    await renderAtRoute(detailsOf(app.id));

    await screen.findByRole('link', { name: akMT('storeknox.unscannedVersion') });

    const fakeApps = document.querySelector('[data-test-sk-action="brand-abuse"]') as HTMLElement;

    expect(fakeApps.querySelector('[data-test-sk-action-loading]')).toBeInTheDocument();
  });
});

describe('the colour each check is drawn in', () => {
  it('draws checks on sale purple, a clear check green, and one needing action red', async () => {
    signInToStoreknox({ is_owner: true });
    mockSkSubscription();
    mockStoreknoxOrganization();

    const app = buildSkInventoryApp();

    mockSkInventoryApp(app);

    await renderAtRoute(detailsOf(app.id));

    await screen.findByRole('link', { name: akMT('storeknox.malwareDetected') });

    const chipOf = (id: string) =>
      document.querySelector(`[data-test-sk-action="${id}"] [data-state]`);

    expect(chipOf('malware-detected')).toHaveAttribute('data-state', 'feature-in-progress');
    expect(chipOf('brand-abuse')).toHaveAttribute('data-state', 'feature-in-progress');
    expect(chipOf('unscanned-version')).toHaveAttribute('data-state', 'no-action');
  });

  it('draws a check that found something red', async () => {
    signInToStoreknox({ is_owner: true });
    mockSkSubscription();
    mockStoreknoxOrganization();

    const app = buildSkInventoryApp({
      store_monitoring_status: ENUMS.SK_APP_MONITORING_STATUS.ACTION_NEEDED,
    });

    mockSkInventoryApp(app);

    await renderAtRoute(detailsOf(app.id));

    await screen.findByRole('link', { name: akMT('storeknox.unscannedVersion') });

    expect(
      document.querySelector('[data-test-sk-action="unscanned-version"] [data-state]')
    ).toHaveAttribute('data-state', 'needs-action');
  });
});
