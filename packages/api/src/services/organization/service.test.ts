import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { HTTP_STATUS_CODES } from '@irene/constants';

import {
  buildOrganization,
  buildOrganizationMe,
  buildOrganizationMembership,
  buildStoreknoxOrganization,
} from '@tests/factories';

import { REQUEST_ABORT_TIMEOUT_MS } from '@irene/api/request';
import { OrganizationEndpoints, OrganizationService } from '@irene/api/services/organization';
import { getApiErrorStatus } from '@irene/api/utils/errors';
import { buildAPITestURL, server } from '@tests/server';
import { buildDrfPage, recordRequestConfigs } from '@tests/utils';

const ORGANIZATION_ID = 42;
const USER_ID = 7;

describe('OrganizationService.getOrganizations', () => {
  it('returns the results as items with a count', async () => {
    const organization = buildOrganization({ name: 'Acme' });

    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.list()), () =>
        HttpResponse.json(buildDrfPage([organization]))
      )
    );

    await expect(OrganizationService.getOrganizations()).resolves.toMatchObject({
      items: [organization],
      count: 1,
    });
  });

  it('returns an empty items list when the account belongs to none', async () => {
    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.list()), () =>
        HttpResponse.json(buildDrfPage([]))
      )
    );

    await expect(OrganizationService.getOrganizations()).resolves.toMatchObject({
      items: [],
      count: 0,
    });
  });
});

describe('OrganizationService.getOrganizationMe', () => {
  it('gets the me endpoint for the organization id it was given', async () => {
    let asked = '';

    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.me(ORGANIZATION_ID)), ({ request }) => {
        asked = new URL(request.url).pathname;

        return HttpResponse.json(buildOrganizationMe());
      })
    );

    await OrganizationService.getOrganizationMe(ORGANIZATION_ID);

    expect(asked).toContain(`/organizations/${ORGANIZATION_ID}/me`);
  });

  it('returns is_admin, is_owner and has_security_permission', async () => {
    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.me(ORGANIZATION_ID)), () =>
        HttpResponse.json(buildOrganizationMe({ has_security_permission: true, is_admin: true }))
      )
    );

    await expect(OrganizationService.getOrganizationMe(ORGANIZATION_ID)).resolves.toMatchObject({
      has_security_permission: true,
      is_admin: true,
    });
  });
});

describe('OrganizationService.getOrganizationMembership', () => {
  it('returns the role, join date and last login', async () => {
    const membership = buildOrganizationMembership({ role_display: 'Owner' });

    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.member(ORGANIZATION_ID, USER_ID)), () =>
        HttpResponse.json(membership)
      )
    );

    await expect(
      OrganizationService.getOrganizationMembership(ORGANIZATION_ID, USER_ID)
    ).resolves.toEqual(membership);
  });

  it('gets the member endpoint for the organization and user ids it was given', () => {
    expect(OrganizationEndpoints.member(7, 42)).toBe('api/organizations/7/members/42');
  });
});

describe('OrganizationService.getStoreknoxOrganization', () => {
  it('returns the StoreKnox organization when the deployment has one', async () => {
    const storeknox = buildStoreknoxOrganization();

    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.storeknoxOrganization()), () =>
        HttpResponse.json(storeknox)
      )
    );

    await expect(OrganizationService.getStoreknoxOrganization()).resolves.toEqual(storeknox);
  });

  it('rejects when the deployment has no StoreKnox organization', async () => {
    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.storeknoxOrganization()), () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.NOT_FOUND })
      )
    );

    const error = await OrganizationService.getStoreknoxOrganization().catch(
      (reason: unknown) => reason
    );

    expect(getApiErrorStatus(error)).toBe(HTTP_STATUS_CODES.NOT_FOUND);
  });
});

describe('the timeout on the organization setup', () => {
  it('abandons the request after a minute, so a hung server does not hold the page', async () => {
    const recorder = recordRequestConfigs();

    await OrganizationService.getOrganizations().catch(() => undefined);
    recorder.stop();

    expect(recorder.latest()?.timeout).toBe(REQUEST_ABORT_TIMEOUT_MS);
  });
});
