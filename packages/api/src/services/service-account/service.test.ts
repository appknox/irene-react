import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { HTTP_STATUS_CODES } from '@irene/constants';

import {
  SERVICE_ACCOUNT_TYPE,
  ServiceAccountEndpoints,
  ServiceAccountService,
} from '@irene/api/services/service-account';

import { buildAPITestURL, server } from '@tests/server';
import { buildDrfPage, recordRequestConfigs } from '@tests/utils';

const SERVICE_ACCOUNT_ID = 9;

const ACCOUNT = {
  id: SERVICE_ACCOUNT_ID,
  name: 'CI uploads',
  description: 'Used by the build',
  access_key_id: 'AKIA',
  expiry: null,
  is_expired: false,
  is_active: true,
  all_projects: true,
  service_account_type: SERVICE_ACCOUNT_TYPE.user,
  created_on: '2026-01-01T00:00:00Z',
  updated_on: '2026-01-01T00:00:00Z',
  created_by_user: 3,
  updated_by_user: null,
  scope_public_api_user_read: true,
  scope_public_api_user_write: false,
  scope_public_api_project_read: true,
  scope_public_api_scan_result_va: false,
  scope_public_api_upload_app: true,
  scope_public_api_team_operations: false,
  scope_public_api_store_release_readiness: false,
  scope_auto_approve_new_name_spaces: false,
  scope_cli: false,
  cli_scope_auto_approve_new_name_spaces: false,
};

describe('ServiceAccountService.getServiceAccounts', () => {
  it('leaves out the accounts the system made unless they are asked for', async () => {
    const recorder = recordRequestConfigs();

    server.use(
      http.get(buildAPITestURL(ServiceAccountEndpoints.list()), () =>
        HttpResponse.json(buildDrfPage([ACCOUNT]))
      )
    );

    await ServiceAccountService.getServiceAccounts({
      limit: 10,
      offset: 0,
      showSystemCreated: false,
      showCliEnabled: false,
    });

    recorder.stop();

    expect(recorder.latest()?.params).toStrictEqual({
      limit: 10,
      offset: 0,
      service_account_type: SERVICE_ACCOUNT_TYPE.user,
    });
  });

  it('asks for every account, and only the command line’s, when both are chosen', async () => {
    const recorder = recordRequestConfigs();

    server.use(
      http.get(buildAPITestURL(ServiceAccountEndpoints.list()), () =>
        HttpResponse.json(buildDrfPage([ACCOUNT]))
      )
    );

    await ServiceAccountService.getServiceAccounts({
      limit: 25,
      offset: 25,
      showSystemCreated: true,
      showCliEnabled: true,
    });

    recorder.stop();

    expect(recorder.latest()?.params).toStrictEqual({
      limit: 25,
      offset: 25,
      scope_cli: true,
    });
  });

  it('returns the accounts as items with a count', async () => {
    server.use(
      http.get(buildAPITestURL(ServiceAccountEndpoints.list()), () =>
        HttpResponse.json(buildDrfPage([ACCOUNT]))
      )
    );

    await expect(
      ServiceAccountService.getServiceAccounts({
        limit: 10,
        offset: 0,
        showSystemCreated: false,
        showCliEnabled: false,
      })
    ).resolves.toMatchObject({ items: [ACCOUNT], count: 1 });
  });
});

describe('one service account', () => {
  it('is read by its id', async () => {
    server.use(
      http.get(buildAPITestURL(ServiceAccountEndpoints.detail(SERVICE_ACCOUNT_ID)), () =>
        HttpResponse.json(ACCOUNT)
      )
    );

    await expect(
      ServiceAccountService.getServiceAccount(SERVICE_ACCOUNT_ID)
    ).resolves.toStrictEqual(ACCOUNT);
  });

  it('comes back with its secret when it is made', async () => {
    let sent: unknown = null;

    server.use(
      http.post(buildAPITestURL(ServiceAccountEndpoints.list()), async ({ request }) => {
        sent = await request.json();

        return HttpResponse.json({ ...ACCOUNT, secret_access_key: 'shh' });
      })
    );

    const details = {
      name: 'CI uploads',
      description: 'Used by the build',
      expiry: null,
      all_projects: true,
    };

    await expect(ServiceAccountService.createServiceAccount(details)).resolves.toMatchObject({
      secret_access_key: 'shh',
    });

    expect(sent).toStrictEqual(details);
  });

  it('is changed by sending the account back with the change written over it', async () => {
    let sent: unknown = null;

    server.use(
      http.put(
        buildAPITestURL(ServiceAccountEndpoints.detail(SERVICE_ACCOUNT_ID)),
        async ({ request }) => {
          sent = await request.json();

          return HttpResponse.json({ ...ACCOUNT, scope_cli: true });
        }
      )
    );

    await ServiceAccountService.updateServiceAccount(ACCOUNT, { scope_cli: true });

    expect(sent).toStrictEqual({ ...ACCOUNT, scope_cli: true });
  });

  it('leaves the secret out of the body it sends', async () => {
    let sent: Record<string, unknown> | null = null;

    server.use(
      http.put(
        buildAPITestURL(ServiceAccountEndpoints.detail(SERVICE_ACCOUNT_ID)),
        async ({ request }) => {
          sent = (await request.json()) as Record<string, unknown>;

          return HttpResponse.json(ACCOUNT);
        }
      )
    );

    await ServiceAccountService.updateServiceAccount(
      { ...ACCOUNT, secret_access_key: 'shh' },
      { name: 'Renamed' }
    );

    expect(sent).not.toHaveProperty('secret_access_key');
    expect(sent).toHaveProperty('name', 'Renamed');
  });

  it('is issued a new secret, with whatever expiry is asked for', async () => {
    let sent: unknown = null;

    server.use(
      http.put(
        buildAPITestURL(ServiceAccountEndpoints.keyReset(SERVICE_ACCOUNT_ID)),
        async ({ request }) => {
          sent = await request.json();

          return HttpResponse.json({ ...ACCOUNT, secret_access_key: 'new' });
        }
      )
    );

    await expect(
      ServiceAccountService.resetServiceAccountKey(SERVICE_ACCOUNT_ID, '2026-12-31T00:00:00Z')
    ).resolves.toMatchObject({ secret_access_key: 'new' });

    expect(sent).toStrictEqual({ expiry: '2026-12-31T00:00:00Z' });
  });

  it('is withdrawn', async () => {
    let withdrawn = false;

    server.use(
      http.delete(buildAPITestURL(ServiceAccountEndpoints.detail(SERVICE_ACCOUNT_ID)), () => {
        withdrawn = true;

        return new HttpResponse(null, { status: HTTP_STATUS_CODES.NO_CONTENT });
      })
    );

    await ServiceAccountService.deleteServiceAccount(SERVICE_ACCOUNT_ID);

    expect(withdrawn).toBe(true);
  });
});

describe('the projects one service account reaches', () => {
  const placing = {
    id: 4,
    project: 11,
    service_account: SERVICE_ACCOUNT_ID,
    added_on: '2026-01-02T00:00:00Z',
  };

  it('are read a page at a time', async () => {
    server.use(
      http.get(buildAPITestURL(ServiceAccountEndpoints.projects(SERVICE_ACCOUNT_ID)), () =>
        HttpResponse.json(buildDrfPage([placing]))
      )
    );

    await expect(
      ServiceAccountService.getServiceAccountProjects(SERVICE_ACCOUNT_ID, {
        limit: 10,
        offset: 0,
      })
    ).resolves.toMatchObject({ items: [placing], count: 1 });
  });

  it('gain one by the project’s own id', async () => {
    let sent: unknown = null;

    server.use(
      http.post(
        buildAPITestURL(ServiceAccountEndpoints.projects(SERVICE_ACCOUNT_ID)),
        async ({ request }) => {
          sent = await request.json();

          return HttpResponse.json(placing);
        }
      )
    );

    await ServiceAccountService.addServiceAccountProject(SERVICE_ACCOUNT_ID, 11);

    expect(sent).toStrictEqual({ project_id: 11 });
  });

  it('lose one by the placing’s id, not the project’s', async () => {
    let removed = false;

    server.use(
      http.delete(buildAPITestURL(ServiceAccountEndpoints.project(placing.id)), () => {
        removed = true;

        return new HttpResponse(null, { status: HTTP_STATUS_CODES.NO_CONTENT });
      })
    );

    await ServiceAccountService.deleteServiceAccountProject(placing.id);

    expect(removed).toBe(true);
  });
});
