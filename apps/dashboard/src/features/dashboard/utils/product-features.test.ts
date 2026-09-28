import { describe, expect, it } from 'vitest';

import {
  buildProductFeatures,
  getProductFeatureIdForPath,
  getProductFeatureName,
} from '@/features/dashboard/utils/product-features';

import { akMT } from '@irene/translations/intl';

/** An account on a whitelabel install, entitled to nothing beyond Appknox. */
const NO_FEATURES = {
  hasStoreknox: false,
  showsOffensiveSecurity: false,
  hasReporting: false,
  hasSecurityPermission: false,
  isEnterprise: false,
  isAppknoxUrl: false,
};

const buildIds = (access: Partial<typeof NO_FEATURES>) =>
  buildProductFeatures({ ...NO_FEATURES, ...access }).map((product) => product.id);

const buildProduct = (id: string, access: Partial<typeof NO_FEATURES> = {}) =>
  buildProductFeatures({ ...NO_FEATURES, ...access }).find((product) => product.id === id);

describe('getProductFeatureIdForPath', () => {
  it.each([
    ['/dashboard/storeknox/inventory/app-list', 'storeknox'],
    ['/dashboard/offensive-security', 'offensive-security'],
    ['/dashboard/reports', 'reporting'],
    ['/security/projects', 'security'],
  ])('%s is the entry page of %s', (pathname, product) => {
    expect(getProductFeatureIdForPath(pathname)).toBe(product);
  });

  it.each([
    '/dashboard/storeknox',
    '/dashboard/storeknox/inventory/pending-review',
    '/dashboard/reports/12',
    '/security/projects/4/scans/9',
  ])('%s belongs to the product whose entry page it sits beneath', (pathname) => {
    expect(getProductFeatureIdForPath(pathname)).not.toBe('appknox');
  });

  it.each([
    '/dashboard/projects',
    '/dashboard/projects/4/files/9',
    '/dashboard/organization/namespaces',
    '/partner/clients',
    '/',
  ])('%s belongs to Appknox, which holds every path no other product claims', (pathname) => {
    expect(getProductFeatureIdForPath(pathname)).toBe('appknox');
  });

  it.each([
    '/dashboard/store-release-readiness',
    '/dashboard/storeknox-archive',
    '/dashboard/reports-archive',
    '/security-settings',
  ])("%s belongs to Appknox although its name starts with another product's path", (pathname) => {
    expect(getProductFeatureIdForPath(pathname)).toBe('appknox');
  });
});

describe('getProductFeatureName', () => {
  it.each([
    ['appknox', akMT('vapt')],
    ['storeknox', akMT('appMonitoring')],
    ['offensive-security', akMT('offensiveSecurity.title')],
    ['reporting', akMT('reportModule.title')],
    ['security', akMT('securityDashboard')],
  ] as const)('calls %s "%s" on a whitelabel install', (id, expected) => {
    expect(getProductFeatureName(id, false)).toBe(expected);
  });

  it.each([
    ['appknox', akMT('appknox')],
    ['storeknox', akMT('storeknox.title')],
    ['offensive-security', akMT('offensiveSecurity.title')],
    ['reporting', akMT('reportModule.title')],
    ['security', akMT('securityDashboard')],
  ] as const)('calls %s "%s" on an Appknox host', (id, expected) => {
    expect(getProductFeatureName(id, true)).toBe(expected);
  });
});

describe('buildProductFeatures', () => {
  it('offers Appknox to every account, whatever it is entitled to', () => {
    expect(buildIds({})).toEqual(['appknox']);
  });

  it('names each product as getProductFeatureName does, so a card and a tab never drift', () => {
    expect(buildProduct('appknox')?.title).toBe(getProductFeatureName('appknox', false));

    expect(buildProduct('appknox', { isAppknoxUrl: true })?.title).toBe(
      getProductFeatureName('appknox', true)
    );
  });

  it('offers StoreKnox only to an organization entitled to it', () => {
    expect(buildIds({})).not.toContain('storeknox');
    expect(buildIds({ hasStoreknox: true })).toContain('storeknox');
  });

  it('offers offensive security only to an organization entitled to it', () => {
    expect(buildIds({})).not.toContain('offensive-security');
    expect(buildIds({ showsOffensiveSecurity: true })).toContain('offensive-security');
  });

  it('offers reporting to a hosted organization entitled to it', () => {
    expect(buildIds({ hasReporting: true })).toContain('reporting');
  });

  it('withholds reporting from a self-hosted install, which is never sold it', () => {
    expect(buildIds({ hasReporting: true, isEnterprise: true })).not.toContain('reporting');
  });

  it('offers the security dashboard only to an account that may reach it', () => {
    expect(buildIds({})).not.toContain('security');
    expect(buildIds({ hasSecurityPermission: true })).toContain('security');
  });

  it('opens the security dashboard in a tab of its own, since it is served as its own app', () => {
    const security = buildProduct('security', { hasSecurityPermission: true });

    expect(security?.destination).toEqual({ kind: 'app', href: '/security/projects' });
    expect(security?.opensInNewTab).toBe(true);
  });

  it.each([
    ['appknox', '/dashboard/projects'],
    ['storeknox', '/dashboard/storeknox/inventory/app-list'],
    ['offensive-security', '/dashboard/offensive-security'],
    ['reporting', '/dashboard/reports'],
  ])('leads %s to %s through the router', (id, to) => {
    const product = buildProduct(id, {
      hasStoreknox: true,
      showsOffensiveSecurity: true,
      hasReporting: true,
    });

    expect(product?.destination).toEqual({ kind: 'route', to });
  });

  it('orders the products as the landing page shows them', () => {
    const ids = buildIds({
      hasStoreknox: true,
      showsOffensiveSecurity: true,
      hasReporting: true,
      hasSecurityPermission: true,
    });

    expect(ids).toEqual(['appknox', 'storeknox', 'offensive-security', 'reporting', 'security']);
  });

  it('describes every product, so no card renders with an empty body', () => {
    const undescribed = buildProductFeatures({
      ...NO_FEATURES,
      hasStoreknox: true,
      showsOffensiveSecurity: true,
      hasReporting: true,
      hasSecurityPermission: true,
    })
      .filter((product) => !product.description)
      .map((product) => product.id);

    expect(undescribed).toEqual([]);
  });
});
