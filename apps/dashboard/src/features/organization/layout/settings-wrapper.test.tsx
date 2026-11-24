import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import type { ApiOrganization } from '@irene/api/services/organization';
import { organizationStore } from '@irene/api/stores/organization';
import { clearStoredSession, storeSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';

import { buildOrganization, buildOrganizationMe, buildSession } from '@tests/factories';
import { renderAtAddress } from '@tests/render';

import { OrganizationSettingsWrapper } from './settings-wrapper';

const SETTINGS_ADDRESS = '/dashboard/organization/settings';

/** Puts the account in an organization with the standing, features and name given. */
const inOrganization = ({
  name = 'Acme',
  isOwner = true,
  isAdmin = true,
  publicApis = false,
  aiFeatures = {},
}: {
  name?: string;
  isOwner?: boolean;
  isAdmin?: boolean;
  publicApis?: boolean;
  aiFeatures?: Partial<ApiOrganization['ai_features']>;
}) => {
  const organization = buildOrganization({ name });

  organization.features.public_apis = publicApis;

  organization.ai_features = {
    reporting: false,
    pii: false,
    knoxiq: false,
    ai_dast: false,
    ...aiFeatures,
  };

  organizationStore
    .getState()
    .select(organization, buildOrganizationMe({ is_owner: isOwner, is_admin: isAdmin }));
};

/** The tab by its name, for asserting which are offered. */
const tab = (name: string) => screen.queryByRole('tab', { name });

describe('the frame around the organization’s settings', () => {
  beforeEach(() => {
    clearStoredSession();
    storeSession(buildSession());
  });

  it('offers the settings and the integrations to everyone', async () => {
    inOrganization({ isOwner: false, isAdmin: false });

    renderAtAddress(<OrganizationSettingsWrapper />, SETTINGS_ADDRESS);

    expect(await screen.findByRole('tab', { name: akMT('organizationSettings') })).toBeVisible();
    expect(tab(akMT('integrations'))).toBeInTheDocument();
  });

  /* irene keeps this one for an account that administers or owns an organization with the API on. */
  it('offers the service account where the public API is on and the account manages the organization', async () => {
    inOrganization({ isOwner: false, isAdmin: true, publicApis: true });

    renderAtAddress(<OrganizationSettingsWrapper />, SETTINGS_ADDRESS);

    expect(await screen.findByRole('tab', { name: akMT('serviceAccount') })).toBeInTheDocument();
  });

  it('withholds the service account where the public API is off', async () => {
    inOrganization({ publicApis: false });

    renderAtAddress(<OrganizationSettingsWrapper />, SETTINGS_ADDRESS);

    await screen.findByRole('tab', { name: akMT('organizationSettings') });

    expect(tab(akMT('serviceAccount'))).not.toBeInTheDocument();
  });

  it('withholds it from an account that only belongs to the organization', async () => {
    inOrganization({ isOwner: false, isAdmin: false, publicApis: true });

    renderAtAddress(<OrganizationSettingsWrapper />, SETTINGS_ADDRESS);

    await screen.findByRole('tab', { name: akMT('organizationSettings') });

    expect(tab(akMT('serviceAccount'))).not.toBeInTheDocument();
  });

  it('offers the AI features to an owner of an organization that has one', async () => {
    inOrganization({ isOwner: true, aiFeatures: { reporting: true } });

    renderAtAddress(<OrganizationSettingsWrapper />, SETTINGS_ADDRESS);

    expect(
      await screen.findByRole('tab', { name: akMT('aiPoweredFeatures') })
    ).toBeInTheDocument();
  });

  it('withholds the AI features where the organization has none', async () => {
    inOrganization({ isOwner: true });

    renderAtAddress(<OrganizationSettingsWrapper />, SETTINGS_ADDRESS);

    await screen.findByRole('tab', { name: akMT('organizationSettings') });

    expect(tab(akMT('aiPoweredFeatures'))).not.toBeInTheDocument();
  });

  it('withholds them from anyone who does not own the organization', async () => {
    inOrganization({ isOwner: false, isAdmin: true, aiFeatures: { reporting: true } });

    renderAtAddress(<OrganizationSettingsWrapper />, SETTINGS_ADDRESS);

    await screen.findByRole('tab', { name: akMT('organizationSettings') });

    expect(tab(akMT('aiPoweredFeatures'))).not.toBeInTheDocument();
  });

  it('offers an owner the way to rename the organization', async () => {
    const user = userEvent.setup();

    inOrganization({ name: 'Acme', isOwner: true });

    renderAtAddress(<OrganizationSettingsWrapper />, SETTINGS_ADDRESS);

    await user.click(await screen.findByRole('button', { name: new RegExp(akMT('editName')) }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('withholds the rename from anyone else', async () => {
    inOrganization({ name: 'Acme', isOwner: false, isAdmin: true });

    renderAtAddress(<OrganizationSettingsWrapper />, SETTINGS_ADDRESS);

    await screen.findByRole('tab', { name: akMT('organizationSettings') });

    expect(screen.queryByRole('button', { name: new RegExp(akMT('editName')) })).not.toBeInTheDocument();
  });

  /* An organization with no name is named rather than renamed, which the header itself offers. */
  it('withholds the rename until the organization has a name', async () => {
    inOrganization({ name: '', isOwner: true });

    renderAtAddress(<OrganizationSettingsWrapper />, SETTINGS_ADDRESS);

    await screen.findByRole('tab', { name: akMT('organizationSettings') });

    expect(screen.queryByRole('button', { name: new RegExp(akMT('editName')) })).not.toBeInTheDocument();
  });
});
