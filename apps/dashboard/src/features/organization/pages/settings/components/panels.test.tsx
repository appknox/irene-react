import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Fragment, type ReactNode } from 'react';
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

import { EditAnalysisPanel } from './edit-analysis';
import { RegulatoryPreferencesPanel } from './regulatory-preferences';

const SETTINGS_ADDRESS = '/dashboard/organization/settings';

const NO_REGULATIONS = {
  show_pcidss: false,
  show_hipaa: false,
  show_gdpr: false,
  show_nist: false,
  show_sama: false,
  show_dora: false,
  show_eucra: false,
  show_popia: false,
};

const renderPanel = (panel: ReactNode) =>
  renderAtAddress(
    <Fragment>
      {panel}

      <AkToaster />
    </Fragment>,
    SETTINGS_ADDRESS
  );

/** Puts the account in an organization whose members may or may not ask for overrides. */
const inOrganizationWith = ({ memberOverrideRequest }: { memberOverrideRequest: boolean }) => {
  const organization = buildOrganization();

  organization.features = {
    ...organization.features,
    member_override_request: memberOverrideRequest,
  };

  organizationStore.getState().select(organization, buildOrganizationMe({ is_owner: true }));
};

beforeEach(() => {
  clearStoredSession();
  storeSession(buildSession());
  inOrganizationWith({ memberOverrideRequest: false });
});

describe('the edit-analysis panel', () => {
  it('reads the organization it is set on', async () => {
    inOrganizationWith({ memberOverrideRequest: true });

    renderPanel(<EditAnalysisPanel />);

    expect(await screen.findByLabelText(akMT('allowEditAnalysisForMembers'))).toBeChecked();
  });

  it('turns the feature on and says so', async () => {
    const user = userEvent.setup();

    let sent: unknown = null;

    server.use(
      http.patch(
        `*/${OrganizationEndpoints.memberOverrideRequestFeature('*')}`,
        async ({ request }) => {
          sent = await request.json();

          return HttpResponse.json({ member_override_request: true });
        }
      )
    );

    renderPanel(<EditAnalysisPanel />);

    await user.click(await screen.findByLabelText(akMT('allowEditAnalysisForMembers')));

    expect(await screen.findByText(akMT('allowEditAnalysisForMembersChanged'))).toBeInTheDocument();
    expect(sent).toStrictEqual({ member_override_request: true });

    /* Written back to the store the navigation and the other screens read. */
    expect(organizationStore.getState().features().member_override_request).toBe(true);
  });

  it('leaves the switch as it was where the request is refused', async () => {
    const user = userEvent.setup();

    server.use(
      http.patch(
        `*/${OrganizationEndpoints.memberOverrideRequestFeature('*')}`,
        () => new HttpResponse(null, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    renderPanel(<EditAnalysisPanel />);

    await user.click(await screen.findByLabelText(akMT('allowEditAnalysisForMembers')));

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByLabelText(akMT('allowEditAnalysisForMembers'))).not.toBeChecked()
    );
  });
});

describe('the regulatory preferences panel', () => {
  it('ticks the regulations the reports carry', async () => {
    server.use(
      http.get(`*/${OrganizationEndpoints.preference('*')}`, () =>
        HttpResponse.json({
          id: 1,
          report_preference: { ...NO_REGULATIONS, show_gdpr: true },
        })
      )
    );

    renderPanel(<RegulatoryPreferencesPanel />);

    expect(await screen.findByLabelText(akMT('gdpr'))).toBeChecked();
    expect(screen.getByLabelText(akMT('hipaa'))).not.toBeChecked();
    expect(screen.getByLabelText(akMT('popia'))).toBeInTheDocument();
  });

  it('sends the whole set when one regulation is turned on', async () => {
    const user = userEvent.setup();

    let sent: Record<string, unknown> | null = null;

    server.use(
      http.get(`*/${OrganizationEndpoints.preference('*')}`, () =>
        HttpResponse.json({ id: 1, report_preference: { ...NO_REGULATIONS, show_gdpr: true } })
      ),

      http.put(`*/${OrganizationEndpoints.preference('*')}`, async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json({ id: 1, report_preference: NO_REGULATIONS });
      })
    );

    renderPanel(<RegulatoryPreferencesPanel />);

    await user.click(await screen.findByLabelText(akMT('hipaa')));

    await waitFor(() => expect(sent).not.toBeNull());

    expect(sent).toStrictEqual({
      report_preference: { ...NO_REGULATIONS, show_gdpr: true, show_hipaa: true },
    });
  });

  it('says what went wrong where the set is refused', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`*/${OrganizationEndpoints.preference('*')}`, () =>
        HttpResponse.json({ id: 1, report_preference: NO_REGULATIONS })
      ),

      http.put(
        `*/${OrganizationEndpoints.preference('*')}`,
        () => new HttpResponse(null, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    renderPanel(<RegulatoryPreferencesPanel />);

    await user.click(await screen.findByLabelText(akMT('nist')));

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
  });

  it('draws nothing where the organization has no preferences to read', async () => {
    server.use(
      http.get(
        `*/${OrganizationEndpoints.preference('*')}`,
        () => new HttpResponse(null, { status: HTTP_STATUS_CODES.NOT_FOUND })
      )
    );

    renderPanel(<RegulatoryPreferencesPanel />);

    await waitFor(() =>
      expect(screen.queryByText(akMT('regulatoryPreferences'))).not.toBeInTheDocument()
    );
  });
});
