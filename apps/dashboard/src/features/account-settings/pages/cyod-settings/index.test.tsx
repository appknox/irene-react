import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  OrganizationEndpoints,
  type ApiCyodRegisteredDevice,
} from '@irene/api/services/organization';

import { configurationStore } from '@irene/api/stores/configuration';
import { storeSession } from '@irene/api/utils/session';
import { MERCER_DOWNLOAD_URL } from '@irene/config/product';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';

import {
  buildCyodRegisteredDevice,
  buildServerConfiguration,
  buildSession,
} from '@tests/factories';

import { mockOrganizationFeatures, mockOrganizationMe } from '@tests/organization';
import { renderAtRoute } from '@tests/render';
import { server } from '@tests/server';

const CYOD_SETTINGS = '/dashboard/settings/cyod-settings';

const REGISTERED_DEVICES_URL = `*/${OrganizationEndpoints.registeredDevices('*')}`;

/** An organization with CYOD, and with device registration on unless the test turns it off. */
const withCyod = ({ isRegistrationEnabled = true } = {}) =>
  mockOrganizationFeatures(
    { cyod: true },
    {},
    { cyod_registration_enabled: isRegistrationEnabled }
  );

const mockDevices = (devices: ApiCyodRegisteredDevice[]) => {
  server.use(http.get(REGISTERED_DEVICES_URL, () => HttpResponse.json({ results: devices })));
};

/** The table row a device's name sits in. */
const deviceRow = async (name: string) => {
  const row = (await screen.findByText(name)).closest('tr');

  if (!row) {
    throw new Error(`No row for ${name}`);
  }

  return row;
};

const deviceSection = () => screen.findByText(akMT('cyod.settings.connectedDevice'));

describe('CyodSettingsPage', () => {
  beforeEach(() => {
    storeSession(buildSession());
    configurationStore.getState().setServerConfiguration(buildServerConfiguration());
    mockDevices([]);
  });

  it('renders nothing for an organization without CYOD, even reached by URL', async () => {
    await renderAtRoute(CYOD_SETTINGS);

    await screen.findByRole('tablist');

    expect(screen.queryByText(akMT('cyod.registration.title'))).not.toBeInTheDocument();
  });

  describe('while registration is off', () => {
    it('asks a member to contact the owner', async () => {
      withCyod({ isRegistrationEnabled: false });

      await renderAtRoute(CYOD_SETTINGS);

      expect(await screen.findByText(akMT('cyod.settings.turnOnDesc'))).toBeInTheDocument();

      expect(
        screen.queryByRole('button', { name: akMT('cyod.settings.registerADevice') })
      ).not.toBeInTheDocument();
    });

    it('points an owner at the organization setting', async () => {
      withCyod({ isRegistrationEnabled: false });
      mockOrganizationMe({ is_owner: true });

      await renderAtRoute(CYOD_SETTINGS);

      expect(await screen.findByText(akMT('cyod.settings.turnOnDescOwner'))).toBeInTheDocument();
    });
  });

  describe('the connected devices', () => {
    it('lists only the devices that are online', async () => {
      const online = buildCyodRegisteredDevice({ is_connected: true });
      const offline = buildCyodRegisteredDevice({ is_connected: false });

      withCyod();
      mockDevices([online, offline]);

      await renderAtRoute(CYOD_SETTINGS);

      const row = await deviceRow(online.name ?? '');

      expect(within(row).getByText(akMT('cyod.deviceRegistration.online'))).toBeInTheDocument();
      expect(screen.queryByText(offline.name ?? '')).not.toBeInTheDocument();
    });

    it('names a device by its model, then its serial number, when the farm gives no name', async () => {
      const byModel = buildCyodRegisteredDevice({ name: null });
      const bySerial = buildCyodRegisteredDevice({ name: null, model: '' });

      withCyod();
      mockDevices([byModel, bySerial]);

      await renderAtRoute(CYOD_SETTINGS);

      expect(await screen.findByText(byModel.model)).toBeInTheDocument();
      expect(screen.getByText(bySerial.serial_number)).toBeInTheDocument();
    });

    it('shows a dash for a device with no registration date', async () => {
      const device = buildCyodRegisteredDevice({ created_on: null });

      withCyod();
      mockDevices([device]);

      await renderAtRoute(CYOD_SETTINGS);

      const row = await deviceRow(device.name ?? '');

      expect(within(row).getByText('-')).toBeInTheDocument();
    });

    it('shows the empty state, pointing at the register button, when no device is online', async () => {
      withCyod();
      mockDevices([buildCyodRegisteredDevice({ is_connected: false })]);

      await renderAtRoute(CYOD_SETTINGS);

      expect(await screen.findByText(akMT('cyod.deviceTable.emptyTitle'))).toBeInTheDocument();
    });

    it('says the device farm is not configured when the organization has none of its own', async () => {
      withCyod();

      server.use(
        http.get(REGISTERED_DEVICES_URL, () =>
          HttpResponse.json({ detail: 'not configured' }, { status: HTTP_STATUS_CODES.FORBIDDEN })
        )
      );

      await renderAtRoute(CYOD_SETTINGS);

      expect(
        await screen.findByText(akMT('cyod.deviceRegistration.notConfigured'))
      ).toBeInTheDocument();
    });

    it('asks again for the devices when refreshed', async () => {
      const device = buildCyodRegisteredDevice();

      withCyod();
      await renderAtRoute(CYOD_SETTINGS);
      await deviceSection();

      expect(await screen.findByText(akMT('cyod.deviceTable.emptyTitle'))).toBeInTheDocument();

      mockDevices([device]);
      await userEvent.click(screen.getByRole('button', { name: akMT('refresh') }));

      expect(await screen.findByText(device.name ?? '')).toBeInTheDocument();
    });
  });

  describe('registering a device', () => {
    const openDrawer = async () => {
      await userEvent.click(
        await screen.findByRole('button', { name: akMT('cyod.settings.registerADevice') })
      );

      return screen.findByRole('dialog');
    };

    it('offers Mercer for each desktop from the release folder', async () => {
      withCyod();

      await renderAtRoute(CYOD_SETTINGS);

      const drawer = await openDrawer();

      expect(
        within(drawer).getByRole('link', { name: akMT('cyod.settings.downloadMercerMac') })
      ).toHaveAttribute('href', `${MERCER_DOWNLOAD_URL}/Mercer-x86_64.dmg`);

      expect(
        within(drawer).getByRole('link', { name: akMT('cyod.settings.downloadMercerWindows') })
      ).toHaveAttribute('href', `${MERCER_DOWNLOAD_URL}/Mercer-windows-x64.exe`);

      expect(
        within(drawer).getByRole('link', { name: akMT('cyod.settings.downloadMercerLinux') })
      ).toHaveAttribute('href', `${MERCER_DOWNLOAD_URL}/mercer.deb`);
    });

    it('copies the server address Mercer signs in to', async () => {
      const user = userEvent.setup();

      withCyod();

      await renderAtRoute(CYOD_SETTINGS);

      await user.click(
        await screen.findByRole('button', { name: akMT('cyod.settings.registerADevice') })
      );

      const drawer = await screen.findByRole('dialog');
      const serverUrl = drawer.querySelector('[data-test-cyod-server-url]')?.textContent ?? '';

      await user.click(within(drawer).getByRole('button', { name: akMT('copy') }));

      expect(await screen.findByText(akMT('copiedToClipboard'))).toBeInTheDocument();
      await expect(navigator.clipboard.readText()).resolves.toBe(serverUrl);
      expect(serverUrl).not.toBe('');
    });

    it('heads the steps as instructions, not as a list of devices', async () => {
      withCyod();

      await renderAtRoute(CYOD_SETTINGS);

      const drawer = await openDrawer();

      expect(within(drawer).getByText(akMT('cyod.settings.howToRegister'))).toBeInTheDocument();

      expect(
        within(drawer).queryByText(akMT('cyod.settings.yourRegisteredDevices'))
      ).not.toBeInTheDocument();
    });

    it('walks through the five steps in order', async () => {
      withCyod();

      await renderAtRoute(CYOD_SETTINGS);

      const drawer = await openDrawer();

      expect(
        within(drawer)
          .getAllByRole('listitem')
          .map((step) => step.dataset.testCyodStep)
      ).toEqual(['1', '2', '3', '4', '5']);
    });

    it('closes from its header', async () => {
      withCyod();

      await renderAtRoute(CYOD_SETTINGS);

      const drawer = await openDrawer();

      await userEvent.click(within(drawer).getByRole('button', { name: akMT('close') }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });
  });
});
