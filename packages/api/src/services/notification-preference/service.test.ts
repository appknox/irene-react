import { faker } from '@faker-js/faker';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  NotificationPreferenceEndpoints,
  NotificationPreferenceService,
} from '@irene/api/services/notification-preference';

import { buildVaNotificationPreference } from '@tests/factories';
import { buildAPITestURL, server } from '@tests/server';

describe('NotificationPreferenceService.getVaPreference', () => {
  it('keeps the four scan-result preferences and drops the role-only ones', async () => {
    const preference = buildVaNotificationPreference();

    server.use(
      http.get(buildAPITestURL(NotificationPreferenceEndpoints.email()), () =>
        HttpResponse.json({ ...preference, upload_failed_payment: faker.datatype.boolean() })
      )
    );

    await expect(NotificationPreferenceService.getVaPreference()).resolves.toEqual(preference);
  });
});

describe('NotificationPreferenceService.updateVaPreference', () => {
  it('puts only the preference being changed, and returns all four', async () => {
    const preference = buildVaNotificationPreference({ dynamic_scan_completed: true });
    let body: unknown;

    server.use(
      http.put(buildAPITestURL(NotificationPreferenceEndpoints.updateVa()), async ({ request }) => {
        body = await request.json();

        return HttpResponse.json(preference);
      })
    );

    await expect(
      NotificationPreferenceService.updateVaPreference('dynamic_scan_completed', true)
    ).resolves.toEqual(preference);

    expect(body).toEqual({ dynamic_scan_completed: true });
  });
});
