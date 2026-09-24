import { http, HttpResponse } from 'msw';

import { OrganizationEndpoints } from '@irene/api/services/organization/endpoints';
import { buildOrganization, buildOrganizationMe } from '@tests/factories';
import { server } from '@tests/server';

import type {
  ApiOrganizationAiFeatures,
  ApiOrganizationFeatures,
  ApiOrganizationMe,
} from '@irene/api/services/organization';

/**
 * Replaces the `OrganizationEndpoints.list()` handler for the current test with
 * one returning a single organization carrying these features.
 *
 * `buildOrganization` leaves every feature off, and the `/dashboard/home` guard
 * redirects to `/dashboard/projects` unless `storeknox` or
 * `has_security_permission` is set. A test that renders `HomePage` enables one
 * here.
 *
 * @param features - Feature flags to enable, merged over `buildOrganization`'s defaults.
 * @param aiFeatures - AI feature flags to enable, merged the same way.
 */
export function mockOrganizationFeatures(
  features: Partial<ApiOrganizationFeatures>,
  aiFeatures: Partial<ApiOrganizationAiFeatures> = {}
) {
  const organization = buildOrganization();

  server.use(
    http.get(`*/${OrganizationEndpoints.list()}`, () =>
      HttpResponse.json({
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            ...organization,
            features: { ...organization.features, ...features },
            ai_features: { ...organization.ai_features, ...aiFeatures },
          },
        ],
      })
    )
  );
}

/**
 * Replaces the `OrganizationEndpoints.me()` handler for the current test with
 * one returning this membership standing.
 *
 * `buildOrganizationMe` grants no permissions, so a test that depends on one —
 * `has_security_permission`, which puts the security dashboard card on the home
 * page — sets it here.
 *
 * @param standing - Fields to override, merged over `buildOrganizationMe`'s defaults.
 */
export function mockOrganizationMe(standing: Partial<ApiOrganizationMe>) {
  server.use(
    http.get(`*/${OrganizationEndpoints.me('*')}`, () =>
      HttpResponse.json({ ...buildOrganizationMe(), ...standing })
    )
  );
}
