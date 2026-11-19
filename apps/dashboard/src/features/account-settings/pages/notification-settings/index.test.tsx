import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  NotificationPreferenceEndpoints,
  type ApiVaNotificationPreference,
} from '@irene/api/services/notification-preference';

import { configurationStore } from '@irene/api/stores/configuration';
import { storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';

import {
  buildServerConfiguration,
  buildSession,
  buildVaNotificationPreference,
} from '@tests/factories';

import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const NOTIFICATION_SETTINGS = '/dashboard/settings/notification-settings';

const PREFERENCE_URL = buildAPITestURL(NotificationPreferenceEndpoints.email());
const UPDATE_URL = buildAPITestURL(NotificationPreferenceEndpoints.updateVa());

const mockPreference = (preference: ApiVaNotificationPreference) => {
  server.use(http.get(PREFERENCE_URL, () => HttpResponse.json(preference)));
};

const toggle = (name: string) => screen.findByRole('switch', { name });

/** Waits for the preferences to arrive, which is when the toggles stop holding. */
const settled = () =>
  waitFor(() =>
    expect(
      screen.getByRole('switch', { name: akMT('accountNotifSettings.vaNotificationTitle') })
    ).toBeEnabled()
  );

describe('NotificationSettingsPage', () => {
  beforeEach(() => {
    storeSession(buildSession());
    configurationStore.getState().setServerConfiguration(buildServerConfiguration());
  });

  it('shows each preference as the account has it', async () => {
    const preference = buildVaNotificationPreference({
      all_va_completed: false,
      static_scan_completed: true,
      dynamic_scan_completed: false,
    });

    mockPreference(preference);

    await renderAtRoute(NOTIFICATION_SETTINGS);
    await settled();

    expect(await toggle(akMT('accountNotifSettings.staticScanTitle'))).toBeChecked();
    expect(await toggle(akMT('accountNotifSettings.dynamicScanTitle'))).not.toBeChecked();
  });

  it('locks the individual scan toggles while the VA notification is on', async () => {
    mockPreference(buildVaNotificationPreference({ all_va_completed: true }));

    await renderAtRoute(NOTIFICATION_SETTINGS);
    await settled();

    expect(await toggle(akMT('accountNotifSettings.staticScanTitle'))).toBeDisabled();
    expect(await toggle(akMT('accountNotifSettings.apiScanTitle'))).toBeDisabled();
  });

  it('sends only the preference that was flipped, and shows what the server now holds', async () => {
    mockPreference(
      buildVaNotificationPreference({ all_va_completed: false, api_scan_completed: false })
    );

    let body: unknown;

    server.use(
      http.put(UPDATE_URL, async ({ request }) => {
        body = await request.json();

        return HttpResponse.json(
          buildVaNotificationPreference({ all_va_completed: false, api_scan_completed: true })
        );
      })
    );

    await renderAtRoute(NOTIFICATION_SETTINGS);
    await settled();
    await userEvent.click(await toggle(akMT('accountNotifSettings.apiScanTitle')));

    expect(
      await screen.findByText(akMT('accountNotifSettings.notificationPreferenceUpdated'))
    ).toBeInTheDocument();

    expect(body).toEqual({ api_scan_completed: true });
    expect(await toggle(akMT('accountNotifSettings.apiScanTitle'))).toBeChecked();
  });

  it('turns the individual scans off and locks them when the VA notification is turned on', async () => {
    mockPreference(
      buildVaNotificationPreference({ all_va_completed: false, static_scan_completed: true })
    );

    server.use(
      http.put(UPDATE_URL, () =>
        HttpResponse.json(
          buildVaNotificationPreference({
            all_va_completed: true,
            static_scan_completed: false,
            dynamic_scan_completed: false,
            api_scan_completed: false,
          })
        )
      )
    );

    await renderAtRoute(NOTIFICATION_SETTINGS);
    await settled();
    await userEvent.click(await toggle(akMT('accountNotifSettings.vaNotificationTitle')));

    const staticScan = await toggle(akMT('accountNotifSettings.staticScanTitle'));

    await waitFor(() => expect(staticScan).not.toBeChecked());
    expect(staticScan).toBeDisabled();
  });

  it('moves the toggle back and says so when the server refuses', async () => {
    mockPreference(
      buildVaNotificationPreference({ all_va_completed: false, dynamic_scan_completed: false })
    );

    server.use(
      http.put(UPDATE_URL, () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    await renderAtRoute(NOTIFICATION_SETTINGS);
    await settled();
    await userEvent.click(await toggle(akMT('accountNotifSettings.dynamicScanTitle')));

    expect(
      await screen.findByText(akMT('accountNotifSettings.notificationPreferenceUpdateFailed'))
    ).toBeInTheDocument();

    expect(await toggle(akMT('accountNotifSettings.dynamicScanTitle'))).not.toBeChecked();
  });

  it('says so, and shows every preference off, when the preferences cannot be fetched', async () => {
    server.use(
      http.get(PREFERENCE_URL, () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    await renderAtRoute(NOTIFICATION_SETTINGS);

    expect(
      await screen.findByText(akMT('accountNotifSettings.errorFetchingPreferences'))
    ).toBeInTheDocument();

    expect(await toggle(akMT('accountNotifSettings.vaNotificationTitle'))).not.toBeChecked();
  });

  it('notes who the emails go to, with its lead-in set in bold', async () => {
    mockPreference(buildVaNotificationPreference());

    await renderAtRoute(NOTIFICATION_SETTINGS);
    await settled();

    const note = document.querySelector('[data-test-notification-note]');

    expect(note?.querySelector('strong')).toBeInTheDocument();
    expect(note?.textContent).not.toContain('<strong>');
  });
});
