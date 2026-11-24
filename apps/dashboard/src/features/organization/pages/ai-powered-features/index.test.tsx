import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { Fragment } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { OrganizationEndpoints } from '@irene/api/services/organization/endpoints';
import { organizationStore } from '@irene/api/stores/organization';
import { clearStoredSession, storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';
import { AkToaster } from '@irene/ui/ak-toaster';

import { buildOrganization, buildOrganizationMe, buildSession } from '@tests/factories';
import { renderAtAddress } from '@tests/render';
import { server } from '@tests/server';

import { OrganizationAiPoweredFeaturesPage } from './index';

const SETTINGS_ADDRESS = '/dashboard/organization/settings/ai-powered-features';

/** What the settings endpoint answers with, and what it was last asked to save. */
let saved: Record<string, boolean> | null = null;

/** Puts the account in an organization entitled to the features named. */
const inOrganizationWith = (
  entitlements: { reporting?: boolean; pii?: boolean; knoxiq?: boolean },
  { hidesUpsell = false } = {}
) => {
  const organization = buildOrganization({ hide_upsell_features: hidesUpsell });

  organization.ai_features = {
    reporting: false,
    pii: false,
    knoxiq: false,
    ai_dast: false,
    ...entitlements,
  };

  organizationStore
    .getState()
    .select(organization, buildOrganizationMe({ is_owner: true, is_admin: true }));
};

/** Answers with which features are switched on, and records what is written back. */
const withSettings = (
  settings: { reporting?: boolean; pii?: boolean; auto_execute_knoxiq_on_cicd_upload?: boolean } = {}
) => {
  const current = {
    reporting: false,
    pii: false,
    auto_execute_knoxiq_on_cicd_upload: false,
    ...settings,
  };

  server.use(
    http.get(`*/${OrganizationEndpoints.aiFeatures('*')}`, () => HttpResponse.json(current)),

    http.put(`*/${OrganizationEndpoints.aiFeatures('*')}`, async ({ request }) => {
      saved = (await request.json()) as Record<string, boolean>;

      return HttpResponse.json(saved);
    })
  );
};

/** Renders the tab with the toaster beside it, as the screen around it has one. */
const renderTab = () =>
  renderAtAddress(
    <Fragment>
      <OrganizationAiPoweredFeaturesPage />

      <AkToaster />
    </Fragment>,
    SETTINGS_ADDRESS
  );

/** The switch beside one feature, by what the feature is called. */
const toggleFor = (header: string) => screen.getByRole('switch', { name: header });

describe('the organization’s AI features', () => {
  beforeEach(() => {
    saved = null;
    clearStoredSession();
    storeSession(buildSession());
    inOrganizationWith({ reporting: true, pii: true, knoxiq: true });
    withSettings();
  });

  it('lists what each feature is and what it does', async () => {
    renderTab();

    expect(await screen.findByText(akMT('reportModule.settingsHeader'))).toBeInTheDocument();
    expect(screen.getByText(akMT('privacyModule.piiLabel'))).toBeInTheDocument();
    expect(screen.getByText(akMT('knoxIq.title'))).toBeInTheDocument();
    expect(screen.getByText(akMT('knoxIq.orgSettingsDesc'))).toBeInTheDocument();
  });

  it('says which of them are on', async () => {
    withSettings({ reporting: true });

    renderTab();

    await screen.findByText(akMT('reportModule.settingsHeader'));

    expect(toggleFor(akMT('reportModule.settingsHeader'))).toBeChecked();
    expect(toggleFor(akMT('privacyModule.piiLabel'))).not.toBeChecked();
  });

  it('draws placeholders until the settings have been read', async () => {
    server.use(
      http.get(`*/${OrganizationEndpoints.aiFeatures('*')}`, async () => {
        await delay('infinite');

        return HttpResponse.json({});
      })
    );

    renderTab();

    await waitFor(() =>
      expect(document.querySelectorAll('[data-test-ai-feature-placeholder]')).toHaveLength(3)
    );
  });

  /* irene asks nothing before turning this one: it explains nothing about data. */
  it('turns KnoxIQ straight away, sending every feature with it', async () => {
    const user = userEvent.setup();

    withSettings({ reporting: true });

    renderTab();
    await screen.findByText(akMT('knoxIq.title'));

    await user.click(toggleFor(akMT('knoxIq.title')));

    await waitFor(() =>
      expect(saved).toEqual({
        reporting: true,
        pii: false,
        auto_execute_knoxiq_on_cicd_upload: true,
      })
    );
  });

  it('asks about the data before turning a feature that explains it', async () => {
    const user = userEvent.setup();

    renderTab();
    await screen.findByText(akMT('reportModule.settingsHeader'));

    await user.click(toggleFor(akMT('reportModule.settingsHeader')));

    expect(await screen.findByText(akMT('reportModule.aiDataAccess'))).toBeInTheDocument();
    expect(saved).toBeNull();

    await user.click(await screen.findByText(akMT('yesTurnOn')));

    await waitFor(() => expect(saved?.reporting).toBe(true));
  });

  it('offers to turn one off where it is already on', async () => {
    const user = userEvent.setup();

    withSettings({ pii: true });

    renderTab();
    await screen.findByText(akMT('privacyModule.piiLabel'));

    await user.click(toggleFor(akMT('privacyModule.piiLabel')));

    expect(await screen.findByText(akMT('yesTurnOff'))).toBeInTheDocument();
  });

  it('leaves the feature as it was where the question is answered with Back', async () => {
    const user = userEvent.setup();

    renderTab();
    await screen.findByText(akMT('privacyModule.piiLabel'));

    await user.click(toggleFor(akMT('privacyModule.piiLabel')));
    await user.click(await screen.findByText(akMT('back')));

    await waitFor(() =>
      expect(screen.queryByText(akMT('privacyModule.piiAiDrawer.aiDataQ1'))).not.toBeInTheDocument()
    );

    expect(saved).toBeNull();
    expect(toggleFor(akMT('privacyModule.piiLabel'))).not.toBeChecked();
  });

  it('says the setting was changed once it is', async () => {
    const user = userEvent.setup();

    renderTab();
    await screen.findByText(akMT('knoxIq.title'));

    await user.click(toggleFor(akMT('knoxIq.title')));

    expect(await screen.findByText(akMT('statusUpdatedSuccessfully'))).toBeInTheDocument();
  });

  it('says what went wrong when a feature cannot be turned', async () => {
    const user = userEvent.setup();

    server.use(
      http.put(`*/${OrganizationEndpoints.aiFeatures('*')}`, () =>
        HttpResponse.json({ detail: 'Not permitted' }, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    renderTab();
    await screen.findByText(akMT('knoxIq.title'));

    await user.click(toggleFor(akMT('knoxIq.title')));

    expect(await screen.findByText('Not permitted')).toBeInTheDocument();
  });

  it('falls back to asking for another try where the refusal says nothing', async () => {
    const user = userEvent.setup();

    server.use(
      http.put(`*/${OrganizationEndpoints.aiFeatures('*')}`, () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    renderTab();
    await screen.findByText(akMT('knoxIq.title'));

    await user.click(toggleFor(akMT('knoxIq.title')));

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
  });

  /* A feature the organization has not bought is shown, but cannot be turned. */
  it('closes the switch on a feature the organization is not entitled to', async () => {
    inOrganizationWith({ reporting: false, pii: true, knoxiq: true });

    renderTab();
    await screen.findByText(akMT('reportModule.settingsHeader'));

    expect(toggleFor(akMT('reportModule.settingsHeader'))).toBeDisabled();
    expect(toggleFor(akMT('privacyModule.piiLabel'))).toBeEnabled();
  });

  it('leaves out a feature the organization is shown no upsell for', async () => {
    inOrganizationWith({ reporting: false, pii: true, knoxiq: true }, { hidesUpsell: true });

    renderTab();

    expect(await screen.findByText(akMT('privacyModule.piiLabel'))).toBeInTheDocument();

    expect(screen.queryByText(akMT('reportModule.settingsHeader'))).not.toBeInTheDocument();
  });
});
