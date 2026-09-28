import { beforeEach, describe, expect, it } from 'vitest';

import { organizationStore } from '@irene/api/stores/organization';
import { buildOrganization, buildOrganizationMe } from '@tests/factories';

const organization = () => organizationStore.getState();

describe('organizationStore', () => {
  beforeEach(() => {
    organization().clear();
  });

  it('starts with selected and me both null', () => {
    expect(organization().selected).toBeNull();
    expect(organization().me).toBeNull();
  });

  it('stores the organization and the permissions passed to select', () => {
    const selected = buildOrganization();
    const me = buildOrganizationMe({ is_owner: true });

    organization().select(selected, me);

    expect(organization().selected).toEqual(selected);
    expect(organization().me).toEqual(me);
  });

  it('sets selected and me to null on clear', () => {
    organization().select(buildOrganization(), buildOrganizationMe({ is_admin: true }));
    organization().clear();

    expect(organization().selected).toBeNull();
    expect(organization().me).toBeNull();
  });

  it('notifies subscribers on select and on clear', () => {
    const seen: (number | null)[] = [];
    const stop = organizationStore.subscribe((state) => seen.push(state.selected?.id ?? null));

    const selected = buildOrganization();

    organization().select(selected, buildOrganizationMe());
    organization().clear();
    stop();

    expect(seen).toEqual([selected.id, null]);
  });
});

describe('what the organization is entitled to', () => {
  beforeEach(() => {
    organization().clear();
  });

  it('reads every feature as off before an organization has arrived', () => {
    expect(organization().features().storeknox).toBe(false);
    expect(organization().aiFeatures().reporting).toBe(false);
  });

  it('reads them from the organization once one is selected', () => {
    const selected = buildOrganization();
    selected.features.storeknox = true;
    selected.ai_features.reporting = true;

    organization().select(selected, buildOrganizationMe());

    expect(organization().features().storeknox).toBe(true);
    expect(organization().aiFeatures().reporting).toBe(true);
  });

  it('counts the projects, and none before one is selected', () => {
    expect(organization().projectsCount()).toBe(0);

    organization().select(buildOrganization({ projects_count: 12 }), buildOrganizationMe());

    expect(organization().projectsCount()).toBe(12);
  });
});

describe('which modules are withheld rather than advertised', () => {
  beforeEach(() => {
    organization().clear();
  });

  it('withholds none while the organization is shown its upsell', () => {
    organization().select(
      buildOrganization({ hide_upsell_features: false }),
      buildOrganizationMe()
    );

    expect(organization().upsellStatus().privacy).toBe(false);
    expect(organization().upsellStatus().sbom).toBe(false);
  });

  it('withholds a module the organization lacks and is shown no upsell for', () => {
    organization().select(buildOrganization({ hide_upsell_features: true }), buildOrganizationMe());

    expect(organization().upsellStatus()).toEqual({
      privacy: true,
      sbom: true,
      storeReleaseReadiness: true,
      offensiveSecurity: true,
      dynamicScanAutomation: true,
      aiReporting: true,
      aiPii: true,
    });
  });

  it('offers a module it does hold, whatever the upsell setting', () => {
    const selected = buildOrganization({ hide_upsell_features: true });
    selected.features.privacy = true;

    organization().select(selected, buildOrganizationMe());

    expect(organization().upsellStatus().privacy).toBe(false);
    expect(organization().upsellStatus().sbom).toBe(true);
  });
});

describe('whether offensive security is offered', () => {
  beforeEach(() => {
    organization().clear();
  });

  it('is not offered to an organization without it', () => {
    organization().select(buildOrganization(), buildOrganizationMe());

    expect(organization().showsOffensiveSecurity()).toBe(false);
  });

  it('is offered to an organization that holds it', () => {
    const selected = buildOrganization();
    selected.features.offensive_security = true;

    organization().select(selected, buildOrganizationMe());

    expect(organization().showsOffensiveSecurity()).toBe(true);
  });

  it('is offered to an organization that holds it and hides its upsell', () => {
    const selected = buildOrganization({ hide_upsell_features: true });
    selected.features.offensive_security = true;

    organization().select(selected, buildOrganizationMe());

    expect(organization().showsOffensiveSecurity()).toBe(true);
  });

  it('is not offered before an organization has been selected', () => {
    expect(organization().showsOffensiveSecurity()).toBe(false);
  });
});

describe('the standing of the signed-in account', () => {
  beforeEach(() => {
    organization().clear();
  });

  it('reads as a member when it neither administers nor owns', () => {
    organization().select(buildOrganization(), buildOrganizationMe());

    expect(organization().isMember()).toBe(true);
    expect(organization().isAdmin()).toBe(false);
    expect(organization().isOwner()).toBe(false);
  });

  it('reads an admin and an owner as running the organization', () => {
    organization().select(buildOrganization(), buildOrganizationMe({ is_admin: true }));
    expect(organization().isMember()).toBe(false);

    organization().select(buildOrganization(), buildOrganizationMe({ is_owner: true }));
    expect(organization().isMember()).toBe(false);
  });

  it('reads the permissions the endpoint answers with', () => {
    organization().select(
      buildOrganization(),
      buildOrganizationMe({ has_security_permission: true, can_access_partner_dashboard: true })
    );

    expect(organization().hasSecurityPermission()).toBe(true);
    expect(organization().canAccessPartnerDashboard()).toBe(true);
  });

  it('grants nothing before an organization has arrived', () => {
    expect(organization().isAdmin()).toBe(false);
    expect(organization().hasSecurityPermission()).toBe(false);
    expect(organization().isMember()).toBe(true);
  });
});
