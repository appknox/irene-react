import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { HTTP_STATUS_CODES } from '@irene/constants';

import {
  buildOrganization,
  buildOrganizationMe,
  buildOrganizationMembership,
  buildStoreknoxOrganization,
} from '@tests/factories';

import { OrganizationEndpoints, OrganizationService } from '@irene/api/services/organization';
import { getApiErrorStatus } from '@irene/api/utils/errors';
import { buildAPITestURL, server } from '@tests/server';
import { buildDrfPage } from '@tests/utils';

const ORGANIZATION_ID = 42;
const USER_ID = 7;

describe('OrganizationService.getOrganizations', () => {
  it('unwraps the page envelope', async () => {
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

  it('reads an empty account as no organizations rather than failing', async () => {
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
  it('asks the endpoint for the organization it was given', async () => {
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

  it('returns the permissions the dashboard branches on', async () => {
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
  it('returns how the account came to be a member', async () => {
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

  it('asks the organization about the account it was given', () => {
    expect(OrganizationEndpoints.member(7, 42)).toBe('api/organizations/7/members/42');
  });
});

describe('OrganizationService.getStoreknoxOrganization', () => {
  it('returns the organization on a deployment that has one', async () => {
    const storeknox = buildStoreknoxOrganization();

    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.storeknoxOrganization()), () =>
        HttpResponse.json(storeknox)
      )
    );

    await expect(OrganizationService.getStoreknoxOrganization()).resolves.toEqual(storeknox);
  });

  it('rejects where there is none, leaving the caller to carry on without it', async () => {
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
