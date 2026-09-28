import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';

import {
  buildDashboardNavItems,
  type DashboardNavAccess,
  type DashboardNavItem,
} from './nav-items';

/** An organization that has no features or permissions. */
const EMPTY_ORG_ACCESS: DashboardNavAccess = {
  hasPublicApis: false,
  hasPrivacy: false,
  hasSbom: false,
  hasStoreReleaseReadiness: false,
  hidesPrivacyUpsell: false,
  hidesSbomUpsell: false,
  hidesStoreReleaseReadinessUpsell: false,
  isEnterprise: false,
  isAdmin: false,
  isOwner: false,
  billingHidden: false,
  showsSubscription: false,
  projectsCount: 0,
  hasMarketplace: false,
  canAccessPartnerDashboard: false,
};

const getNavItemIds = (access: Partial<DashboardNavAccess>) =>
  buildDashboardNavItems({ ...EMPTY_ORG_ACCESS, ...access }).map((item) => item.id);

describe('buildDashboardNavItems', () => {
  it('always offers projects, the organization and account settings', () => {
    expect(getNavItemIds({})).toEqual(
      expect.arrayContaining(['projects', 'organization', 'account-settings'])
    );
  });

  it('leads with projects, since that is where an account lands', () => {
    expect(getNavItemIds({})[0]).toBe('projects');
  });

  it('counts the projects on the item that leads to them', () => {
    const [projects] = buildDashboardNavItems({ ...EMPTY_ORG_ACCESS, projectsCount: 12 });

    expect(projects?.badge).toBe('12');
  });

  it('offers privacy, SBOM and release readiness while the upsell is shown', () => {
    expect(getNavItemIds({})).toEqual(
      expect.arrayContaining(['privacy', 'sbom', 'store-release-readiness'])
    );
  });

  it('withholds each of them from an organization that hides its upsell', () => {
    const ids = getNavItemIds({
      hidesPrivacyUpsell: true,
      hidesSbomUpsell: true,
      hidesStoreReleaseReadinessUpsell: true,
    });

    expect(ids).not.toContain('privacy');
    expect(ids).not.toContain('sbom');
    expect(ids).not.toContain('store-release-readiness');
  });

  it('withholds privacy and SBOM from a self-hosted install, which is sold neither', () => {
    const ids = getNavItemIds({ isEnterprise: true });

    expect(ids).not.toContain('privacy');
    expect(ids).not.toContain('sbom');
    expect(ids).toContain('store-release-readiness');
  });

  it('keeps analytics from a member, who does not run the organization', () => {
    expect(getNavItemIds({})).not.toContain('analytics');
  });

  it('offers analytics to an admin and to an owner', () => {
    expect(getNavItemIds({ isAdmin: true })).toContain('analytics');
    expect(getNavItemIds({ isOwner: true })).toContain('analytics');
  });

  it('offers the API documentation only where the organization bought the public APIs', () => {
    expect(getNavItemIds({})).not.toContain('public-api');
    expect(getNavItemIds({ hasPublicApis: true })).toContain('public-api');
  });

  it('offers billing to an owner', () => {
    expect(getNavItemIds({ isOwner: true })).toContain('billing');
  });

  it('keeps billing from an admin, since the account belongs to the owner', () => {
    expect(getNavItemIds({ isAdmin: true })).not.toContain('billing');
  });

  it('stands the subscription in where billing is hidden', () => {
    const ids = getNavItemIds({ isOwner: true, billingHidden: true, showsSubscription: true });

    expect(ids).toContain('subscription');
    expect(ids).not.toContain('billing');
  });

  it('offers one or the other, never both', () => {
    const ids = getNavItemIds({ isOwner: true, showsSubscription: true });

    expect(ids).toContain('billing');
    expect(ids).not.toContain('subscription');
  });

  it('names every item, so none renders as an empty row', () => {
    const unnamed = buildDashboardNavItems({
      ...EMPTY_ORG_ACCESS,
      isOwner: true,
      hasPublicApis: true,
    })
      .filter((item) => !item.label)
      .map((item) => item.id);

    expect(unnamed).toEqual([]);
  });

  it('translates the labels rather than hardcoding them', () => {
    const [projects] = buildDashboardNavItems(EMPTY_ORG_ACCESS);

    expect(projects?.label).toBe(akMT('allProjects'));
  });

  it('offers the marketplace only where the deployment enables it', () => {
    expect(getNavItemIds({})).not.toContain('marketplace');
    expect(getNavItemIds({ hasMarketplace: true })).toContain('marketplace');
  });

  it('offers the partner clients only to an account that may reach them', () => {
    expect(getNavItemIds({})).not.toContain('clients');
    expect(getNavItemIds({ canAccessPartnerDashboard: true })).toContain('clients');
  });

  it('marks the partner clients as beta, since that is what they are', () => {
    const clients = buildDashboardNavItems({
      ...EMPTY_ORG_ACCESS,
      canAccessPartnerDashboard: true,
    }).find((item) => item.id === 'clients');

    expect(clients?.badge).toBe(akMT('beta'));
  });

  it('orders the items as irene does, so a returning user finds them where they were', () => {
    const ids = getNavItemIds({
      hasPublicApis: true,
      isOwner: true,
      hasMarketplace: true,
      canAccessPartnerDashboard: true,
    });

    expect(ids).toEqual([
      'projects',
      'privacy',
      'sbom',
      'store-release-readiness',
      'analytics',
      'organization',
      'public-api',
      'account-settings',
      'marketplace',
      'billing',
      'clients',
    ]);
  });
});

describe('what each item carries', () => {
  /* Everything an owner of a fully entitled organization is offered, bar the subscription. */
  const everyItem = buildDashboardNavItems({
    ...EMPTY_ORG_ACCESS,
    isOwner: true,
    hasPublicApis: true,
    hasMarketplace: true,
    canAccessPartnerDashboard: true,
    projectsCount: 12,
  });

  const itemById = (id: string, items: DashboardNavItem[] = everyItem) =>
    items.find((item) => item.id === id);

  it.each([
    {
      id: 'projects',
      label: akMT('allProjects'),
      icon: 'material-symbols:folder',
      to: '/dashboard/projects',
    },
    {
      id: 'privacy',
      label: akMT('privacyModule.title'),
      icon: 'material-symbols:shield-outline',
      to: '/dashboard/privacy-module',
    },
    {
      id: 'sbom',
      label: akMT('SBOM'),
      icon: 'material-symbols:receipt-long',
      to: '/dashboard/sbom/apps',
    },
    {
      id: 'store-release-readiness',
      label: akMT('storeReleaseReadiness.title'),
      icon: 'material-symbols:list-alt-check',
      to: '/dashboard/store-release-readiness',
    },
    {
      id: 'analytics',
      label: akMT('analytics'),
      icon: 'material-symbols:graphic-eq',
      to: '/dashboard/analytics',
    },
    {
      id: 'organization',
      label: akMT('organization'),
      icon: 'material-symbols:group',
      to: '/dashboard/organization/namespaces',
    },
    {
      id: 'public-api',
      label: akMT('apiDocumentation'),
      icon: 'hugeicons:api',
      to: '/dashboard/public-api/docs',
    },
    {
      id: 'account-settings',
      label: akMT('accountSettings'),
      icon: 'material-symbols:account-box',
      to: '/dashboard/settings/general',
    },
    {
      id: 'marketplace',
      label: akMT('marketplace'),
      icon: 'material-symbols:account-balance',
      to: '/dashboard/marketplace',
    },
    {
      id: 'billing',
      label: akMT('billing'),
      icon: 'material-symbols:credit-card-outline',
      to: '/dashboard/billing',
    },
    {
      id: 'clients',
      label: akMT('clients'),
      icon: 'material-symbols:groups-2',
      to: '/partner/clients',
    },
  ])('$id is labelled $label, is drawn with $icon and leads to $to', ({ id, label, icon, to }) => {
    const item = itemById(id);

    expect(item?.label).toBe(label);
    expect(item?.icon).toBe(icon);
    expect(item?.to).toBe(to);
  });

  it('labels the subscription, draws it with a certificate and leads to /dashboard/subscription, where it stands in for billing', () => {
    const subscription = itemById(
      'subscription',
      buildDashboardNavItems({
        ...EMPTY_ORG_ACCESS,
        isOwner: true,
        billingHidden: true,
        showsSubscription: true,
      })
    );

    expect(subscription?.label).toBe(akMT('subscription'));
    expect(subscription?.icon).toBe('mdi:file-certificate-outline');
    expect(subscription?.to).toBe('/dashboard/subscription');
  });

  it('adds no search to any item, since every route defaults its own search', () => {
    const withSearch = everyItem.filter((item) => item.search).map((item) => item.id);

    expect(withSearch).toEqual([]);
  });

  it('badges the projects with their count and the clients as beta, and badges nothing else', () => {
    expect(itemById('projects')?.badge).toBe('12');
    expect(itemById('clients')?.badge).toBe(akMT('beta'));

    const badged = everyItem.filter((item) => item.badge).map((item) => item.id);

    expect(badged).toEqual(['projects', 'clients']);
  });

  it('gives no two items the same id, so React keeps each row across a change of access', () => {
    const ids = everyItem.map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
