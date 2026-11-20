import { faker } from '@faker-js/faker';
import { http, HttpResponse, type JsonBodyType } from 'msw';
import { describe, expect, it } from 'vitest';

import { ENUMS } from '@irene/enums';

import {
  buildAddedToInventorySkFakeApp,
  buildArchivedSkApp,
  buildBrandAbuseSkFakeApp,
  buildIgnoredSkFakeApp,
  buildPendingSkRequestedApp,
  buildSkApp,
  buildSkAppVersion,
  buildSkCoreFile,
  buildSkDiscoveryResult,
  buildSkDiscoverySearch,
  buildSkFakeApp,
  buildSkFileRisk,
  buildSkInventoryApp,
  buildSkOrganizationUser,
  buildSkSubscription,
  buildSkThirdPartyApp,
  buildSkThirdPartyConfig,
  buildStoreknoxOrganization,
  buildSubmission,
} from '@tests/factories';

import { FileEndpoints } from '@irene/api/services/file';
import { OrganizationEndpoints } from '@irene/api/services/organization';
import { StoreknoxEndpoints, StoreknoxService } from '@irene/api/services/storeknox';
import { SubmissionEndpoints } from '@irene/api/services/submission';
import { buildAPITestURL, server } from '@tests/server';
import { buildDrfPage } from '@tests/utils';

const url = buildAPITestURL;

/** Answers a request with a reply and keeps what it was sent. */
function capture<TReply extends JsonBodyType>(
  method: 'get' | 'put' | 'post' | 'patch',
  path: string,
  reply: TReply
) {
  const seen: { params: URLSearchParams; body: unknown } = {
    params: new URLSearchParams(),
    body: undefined,
  };

  server.use(
    http[method](url(path), async ({ request }) => {
      seen.params = new URL(request.url).searchParams;
      seen.body = method === 'get' ? undefined : await request.json().catch(() => undefined);

      return HttpResponse.json(reply);
    })
  );

  return seen;
}

describe('StoreknoxService.getApps', () => {
  it('sends the page and filters, and returns the apps with the count', async () => {
    const apps = [buildSkApp(), buildSkApp()];
    const seen = capture('get', StoreknoxEndpoints.apps(), buildDrfPage(apps, { count: 12 }));

    const page = await StoreknoxService.getApps({
      limit: 10,
      offset: 10,
      approval_status: ENUMS.SK_APPROVAL_STATUS.APPROVED,
      app_status: `${ENUMS.SK_APP_STATUS.ACTIVE},${ENUMS.SK_APP_STATUS.DECOMMISSIONED}`,
      monitoring_status: ENUMS.SK_APP_MONITORING_STATUS_FILTER.ACTION_NEEDED,
    });

    expect(page).toMatchObject({ items: apps, count: 12 });
    expect(seen.params.get('offset')).toBe('10');

    expect(seen.params.get('app_status')).toBe(
      `${ENUMS.SK_APP_STATUS.ACTIVE},${ENUMS.SK_APP_STATUS.DECOMMISSIONED}`
    );

    expect(seen.params.get('monitoring_status')).toBe(
      String(ENUMS.SK_APP_MONITORING_STATUS_FILTER.ACTION_NEEDED)
    );
  });
});

describe('StoreknoxService.getInventoryApp', () => {
  it('fetches one app from the details endpoint', async () => {
    const app = buildSkInventoryApp();

    capture('get', StoreknoxEndpoints.appDetail(app.id), app);

    await expect(StoreknoxService.getInventoryApp(app.id)).resolves.toEqual(app);
  });
});

describe('StoreknoxService.updateApprovalStatus', () => {
  it('puts the decision', async () => {
    const app = buildSkApp();
    const seen = capture('put', StoreknoxEndpoints.approvalStatus(app.id), { id: app.id });

    await StoreknoxService.updateApprovalStatus(app.id, ENUMS.SK_APPROVAL_STATUS.REJECTED);

    expect(seen.body).toEqual({ approval_status: ENUMS.SK_APPROVAL_STATUS.REJECTED });
  });
});

describe('StoreknoxService.updateMonitoring', () => {
  it('puts the new monitoring state', async () => {
    const app = buildSkApp();
    const seen = capture('put', StoreknoxEndpoints.monitoringStatus(app.id), { id: app.id });

    await StoreknoxService.updateMonitoring(app.id, false);

    expect(seen.body).toEqual({ monitoring_enabled: false });
  });
});

describe('StoreknoxService.toggleArchiveStatus', () => {
  it('archives an active app', async () => {
    const app = buildSkApp();
    const seen = capture('put', StoreknoxEndpoints.appStatus(app.id), {});

    await StoreknoxService.toggleArchiveStatus(app);

    expect(seen.body).toEqual({ app_status: ENUMS.SK_APP_STATUS.ARCHIVED });
  });

  it('restores an archived app', async () => {
    const app = buildArchivedSkApp();
    const seen = capture('put', StoreknoxEndpoints.appStatus(app.id), {});

    await StoreknoxService.toggleArchiveStatus(app);

    expect(seen.body).toEqual({ app_status: ENUMS.SK_APP_STATUS.ACTIVE });
  });
});

describe('StoreknoxService uploads', () => {
  it('starts an app upload and returns the submission it became', async () => {
    const app = buildSkApp();
    const submission = buildSubmission();

    capture('post', StoreknoxEndpoints.appUpload(app.id), {
      id: submission.id,
      url: '',
      status: 0,
    });

    await expect(StoreknoxService.initiateAppUpload(app.id)).resolves.toMatchObject({
      id: submission.id,
    });
  });

  it('starts a version upload', async () => {
    const version = buildSkAppVersion();
    const submission = buildSubmission();

    capture('post', StoreknoxEndpoints.appVersionUpload(version.id), {
      id: submission.id,
      url: '',
      status: 0,
    });

    await expect(StoreknoxService.initiateAppVersionUpload(version.id)).resolves.toMatchObject({
      id: submission.id,
    });
  });

  it('tags a fetched submission so a pushed status reaches it', async () => {
    const submission = buildSubmission();

    capture('get', SubmissionEndpoints.detail(submission.id), submission);

    await expect(StoreknoxService.getSubmission(submission.id)).resolves.toMatchObject({
      ...submission,
      __record: 'submission',
    });
  });
});

describe('StoreknoxService versions', () => {
  it('asks for the latest versions only, under the app', async () => {
    const version = buildSkAppVersion();

    const seen = capture(
      'get',
      StoreknoxEndpoints.appVersions(version.sk_app),
      buildDrfPage([version])
    );

    const page = await StoreknoxService.getAppVersions(version.sk_app, { is_latest: true });

    expect(page.items).toEqual([version]);
    expect(seen.params.get('is_latest')).toBe('true');
  });

  it('fetches one version', async () => {
    const version = buildSkAppVersion();

    capture('get', StoreknoxEndpoints.appVersion(version.id), version);

    await expect(StoreknoxService.getAppVersion(version.id)).resolves.toEqual(version);
  });
});

describe('StoreknoxService organization', () => {
  it('patches one inventory setting', async () => {
    const organization = buildStoreknoxOrganization();
    const seen = capture('patch', StoreknoxEndpoints.organization(organization.id), organization);

    await StoreknoxService.updateOrganizationSettings(organization.id, {
      auto_discovery_enabled: true,
    });

    expect(seen.body).toEqual({ auto_discovery_enabled: true });
  });

  it('fetches the subscription under the organization', async () => {
    const subscription = buildSkSubscription();

    capture('get', StoreknoxEndpoints.subscription(subscription.sk_organization), subscription);

    await expect(StoreknoxService.getSubscription(subscription.sk_organization)).resolves.toEqual(
      subscription
    );
  });

  it('posts a credit request', async () => {
    const seen = capture('post', StoreknoxEndpoints.creditRequest(), {});

    await StoreknoxService.requestCredits();

    expect(seen.body).toBeUndefined();
  });

  it('fetches one organization member', async () => {
    const user = buildSkOrganizationUser();

    capture('get', OrganizationEndpoints.user(7, user.id), user);

    await expect(StoreknoxService.getOrganizationUser(7, user.id)).resolves.toEqual(user);
  });
});

describe('StoreknoxService files', () => {
  it('fetches a file and its finding counts from v3, tagged so a pushed update reaches them', async () => {
    const file = buildSkCoreFile();
    const risk = buildSkFileRisk();

    capture('get', FileEndpoints.detail(file.id), file);
    capture('get', FileEndpoints.risk(file.id), risk);

    await expect(StoreknoxService.getFile(file.id)).resolves.toEqual({ ...file, __record: 'file' });

    await expect(StoreknoxService.getFileRisk(file.id)).resolves.toEqual({
      ...risk,
      __record: 'file-risk',
    });

    expect(FileEndpoints.detail(file.id)).toBe(`api/v3/files/${file.id}`);
  });
});

describe('StoreknoxService discovery', () => {
  it('starts a search with the query and returns it under its id', async () => {
    const search = buildSkDiscoverySearch();
    const seen = capture('post', StoreknoxEndpoints.discovery(), search);

    await expect(StoreknoxService.createDiscoverySearch(search.query_str)).resolves.toEqual(search);

    expect(seen.body).toEqual({ query_str: search.query_str });
  });

  it('reads a page of a search’s results by its id', async () => {
    const search = buildSkDiscoverySearch();
    const results = [buildSkDiscoveryResult(), buildSkDiscoveryResult()];

    const seen = capture(
      'get',
      StoreknoxEndpoints.discoveryResults(search.id),
      buildDrfPage(results, { count: 14 })
    );

    const page = await StoreknoxService.getDiscoveryResults(search.id, { limit: 10, offset: 10 });

    expect(page).toMatchObject({ items: results, count: 14 });
    expect(seen.params.get('offset')).toBe('10');
  });

  it('asks after a listing by its ulid', async () => {
    const result = buildSkDiscoveryResult();

    const reply = {
      id: 1,
      approval_status: ENUMS.SK_APPROVAL_STATUS.APPROVED,
      approval_status_display: 'Approved',
    };

    const seen = capture('get', StoreknoxEndpoints.approvalStatusCheck(), reply);

    await expect(StoreknoxService.checkApprovalStatus(result.doc_ulid)).resolves.toEqual(reply);
    expect(seen.params.get('doc_ulid')).toBe(result.doc_ulid);
  });

  it('adds a listing with the search it was found by', async () => {
    const result = buildSkDiscoveryResult();
    const app = buildSkApp();
    const seen = capture('post', StoreknoxEndpoints.apps(), app);

    await StoreknoxService.addAppToInventory({ doc_ulid: result.doc_ulid, app_discovery_query: 4 });

    expect(seen.body).toEqual({ doc_ulid: result.doc_ulid, app_discovery_query: 4 });
  });

  it('reads a page of the member’s requests', async () => {
    const requests = [buildPendingSkRequestedApp()];
    const seen = capture('get', StoreknoxEndpoints.requestedApps(), buildDrfPage(requests));

    const page = await StoreknoxService.getRequestedApps({ limit: 25, offset: 0 });

    expect(page.items).toEqual(requests);
    expect(seen.params.get('limit')).toBe('25');
  });
});

describe('StoreknoxService fake apps', () => {
  it('getFakeAppInventory sends the page and the search, and no monitoring filter', async () => {
    const apps = [buildSkApp(), buildSkApp()];
    const q = faker.word.noun();

    const seen = capture(
      'get',
      StoreknoxEndpoints.fakeAppInventory(),
      buildDrfPage(apps, { count: 30 })
    );

    const page = await StoreknoxService.getFakeAppInventory({ limit: 12, offset: 24, q });

    expect(page).toMatchObject({ items: apps, count: 30 });
    expect(seen.params.get('limit')).toBe('12');
    expect(seen.params.get('offset')).toBe('24');
    expect(seen.params.get('q')).toBe(q);
    expect(seen.params.has('monitoring_status')).toBe(false);
  });

  it('getFakeApps leaves classification out for the ignored list', async () => {
    const skAppId = faker.number.int({ min: 1, max: 999 });
    const fakeApps = [buildIgnoredSkFakeApp()];
    const seen = capture('get', StoreknoxEndpoints.fakeApps(skAppId), buildDrfPage(fakeApps));

    const page = await StoreknoxService.getFakeApps(skAppId, {
      limit: 10,
      offset: 0,
      status: 'ignored',
    });

    expect(page.items).toEqual(fakeApps);
    expect(seen.params.get('status')).toBe('ignored');
    expect(seen.params.has('classification')).toBe(false);
  });

  it('getFakeApps sends the status and the classification of a pending list', async () => {
    const skAppId = faker.number.int({ min: 1, max: 999 });

    const seen = capture(
      'get',
      StoreknoxEndpoints.fakeApps(skAppId),
      buildDrfPage([buildBrandAbuseSkFakeApp()])
    );

    await StoreknoxService.getFakeApps(skAppId, {
      limit: 10,
      offset: 20,
      status: 'pending',
      classification: 'brand_abuse',
    });

    expect(seen.params.get('status')).toBe('pending');
    expect(seen.params.get('classification')).toBe('brand_abuse');
    expect(seen.params.get('offset')).toBe('20');
  });

  it('getFakeApp fetches one fake app beneath its inventory app', async () => {
    const skAppId = faker.number.int({ min: 1, max: 999 });
    const fakeApp = buildSkFakeApp();
    capture('get', StoreknoxEndpoints.fakeApp(skAppId, fakeApp.id), fakeApp);

    await expect(StoreknoxService.getFakeApp(skAppId, fakeApp.id)).resolves.toEqual(fakeApp);
  });

  it('ignoreFakeApp posts the reason to the fake app’s ignore path', async () => {
    const skAppId = faker.number.int({ min: 1, max: 999 });
    const fakeApp = buildIgnoredSkFakeApp();
    const reason = faker.lorem.sentence();
    const seen = capture('post', StoreknoxEndpoints.ignoreFakeApp(skAppId, fakeApp.id), fakeApp);

    await expect(StoreknoxService.ignoreFakeApp(skAppId, fakeApp.id, reason)).resolves.toEqual(
      fakeApp
    );

    expect(seen.body).toEqual({ ignore_reason: reason });
  });

  it('addFakeAppToInventory posts the reason to the fake app’s add path', async () => {
    const skAppId = faker.number.int({ min: 1, max: 999 });
    const fakeApp = buildAddedToInventorySkFakeApp();
    const reason = faker.lorem.sentence();

    const seen = capture(
      'post',
      StoreknoxEndpoints.addFakeAppToInventory(skAppId, fakeApp.id),
      fakeApp
    );

    await expect(
      StoreknoxService.addFakeAppToInventory(skAppId, fakeApp.id, reason)
    ).resolves.toEqual(fakeApp);

    expect(seen.body).toEqual({ ignore_reason: reason });
  });
});

describe('StoreknoxService third-party scans', () => {
  it('getThirdPartyApps sends store, region and page, and leaves out an empty filter and risk status', async () => {
    const apps = [buildSkThirdPartyApp(), buildSkThirdPartyApp()];
    const store = faker.helpers.arrayElement(['appstore', 'playstore'] as const);
    const region = faker.location.countryCode().toLowerCase();
    const limit = faker.number.int({ min: 5, max: 50 });
    const offset = faker.number.int({ min: 0, max: 100 });

    const seen = capture(
      'get',
      StoreknoxEndpoints.thirdPartyApps(),
      buildDrfPage(apps, { count: 12 })
    );

    const page = await StoreknoxService.getThirdPartyApps({ store, region, limit, offset });

    expect(page.items).toEqual(apps);
    expect(page.count).toBe(12);

    expect(Object.fromEntries(seen.params)).toEqual({
      store,
      region,
      limit: String(limit),
      offset: String(offset),
    });
  });

  it('getThirdPartyApps sends the risk status as its label', async () => {
    const filter = faker.lorem.word();

    const seen = capture(
      'get',
      StoreknoxEndpoints.thirdPartyApps(),
      buildDrfPage([buildSkThirdPartyApp()])
    );

    await StoreknoxService.getThirdPartyApps({
      store: 'playstore',
      region: 'us',
      limit: 10,
      offset: 0,
      filter,
      risk_status: 'high',
    });

    expect(seen.params.get('risk_status')).toBe('high');
    expect(seen.params.get('filter')).toBe(filter);
  });

  it('getThirdPartyApp asks for one app by package name, store, region and version', async () => {
    const app = buildSkThirdPartyApp();
    const seen = capture('get', StoreknoxEndpoints.thirdPartyApps(), app);

    await expect(
      StoreknoxService.getThirdPartyApp({
        q: app.package_name,
        store: app.store,
        region: app.region,
        version: app.version,
      })
    ).resolves.toEqual(app);

    expect(Object.fromEntries(seen.params)).toEqual({
      q: app.package_name,
      store: app.store,
      region: app.region,
      version: app.version,
    });
  });

  it('getThirdPartyConfig reads the opted regions', async () => {
    const config = buildSkThirdPartyConfig();
    capture('get', StoreknoxEndpoints.thirdPartyConfig(), config);

    await expect(StoreknoxService.getThirdPartyConfig()).resolves.toEqual(config);
  });
});
