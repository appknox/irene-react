import { type ComponentType, type SVGProps } from 'react';

import { akMT } from '@irene/translations/intl';
import AppknoxCover from '@irene/ui/svgs/appknox-bg-img.svg?react';
import OffensiveSecurityCover from '@irene/ui/svgs/offensive-security-bg-img.svg?react';
import OffensiveSecurityIndicator from '@irene/ui/svgs/offensive-security-indicator.svg?react';
import ReportCover from '@irene/ui/svgs/report-bg-img.svg?react';
import ReportIndicator from '@irene/ui/svgs/report-indicator.svg?react';
import SecurityCover from '@irene/ui/svgs/security-bg-img.svg?react';
import SecurityIndicator from '@irene/ui/svgs/security-indicator.svg?react';
import StoreknoxIndicator from '@irene/ui/svgs/sm-indicator.svg?react';
import StoreknoxCover from '@irene/ui/svgs/storeknox-bg-img.svg?react';
import VaptIndicator from '@irene/ui/svgs/vapt-indicator.svg?react';

// All product feature entry routes
type ProductFeatureRoute =
  | '/dashboard/projects'
  | '/dashboard/storeknox/inventory/app-list'
  | '/dashboard/offensive-security'
  | '/dashboard/reports';

/**
 * Where a product feature's card leads.
 *
 * Every product feature is reached through the router, so moving between them
 * costs no reload. The security dashboard is the exception: it is served
 * separately and opens in a tab of its own, so that card is an ordinary link.
 */
export type ProductFeatureDestination =
  { kind: 'route'; to: ProductFeatureRoute } | { kind: 'app'; href: string };

/** The product features this app knows about. */
export type ProductFeatureId =
  'appknox' | 'storeknox' | 'offensive-security' | 'reporting' | 'security';

/** One product feature the account may open from the home page. */
export interface ProductFeature {
  id: ProductFeatureId;
  title: string;
  description: string;
  destination: ProductFeatureDestination;
  cover: ComponentType<SVGProps<SVGSVGElement>>;
  indicator: ComponentType<SVGProps<SVGSVGElement>>;
  opensInNewTab?: boolean;
}

/** What the account is entitled to, and how this install is branded. */
interface ProductFeatureAccess {
  hasStoreknox: boolean;
  showsOffensiveSecurity: boolean;
  hasReporting: boolean;
  hasSecurityPermission: boolean;
  isEnterprise: boolean;
  isAppknoxUrl: boolean;
}

/**
 * What a product is called.
 *
 * An Appknox install names its products after themselves; a whitelabel install
 * names them for what they do, since its customers do not call them Appknox.
 *
 * @param id - The product being named.
 * @param isAppknoxUrl - Whether this tab is on an Appknox host.
 * @returns The name to show.
 */
export const getProductFeatureName = (id: ProductFeatureId, isAppknoxUrl: boolean) => {
  const names: Record<ProductFeatureId, string> = {
    appknox: isAppknoxUrl ? akMT('appknox') : akMT('vapt'),
    storeknox: isAppknoxUrl ? akMT('storeknox.title') : akMT('appMonitoring'),
    reporting: akMT('reportModule.title'),
    security: akMT('securityDashboard'),
    'offensive-security': akMT('offensiveSecurity.title'),
  };

  return names[id];
};

/** The product features this account may open, in the order they are shown. */
export const buildProductFeatures = (access: ProductFeatureAccess): ProductFeature[] => {
  const entries: Array<ProductFeature | false> = [
    {
      id: 'appknox',
      title: getProductFeatureName('appknox', access.isAppknoxUrl),
      description: akMT('appknoxDesc'),
      destination: { kind: 'route', to: '/dashboard/projects' },
      cover: AppknoxCover,
      indicator: VaptIndicator,
    },

    access.hasStoreknox && {
      id: 'storeknox',
      title: getProductFeatureName('storeknox', access.isAppknoxUrl),
      description: akMT('storeknox.description'),
      destination: { kind: 'route', to: '/dashboard/storeknox/inventory/app-list' },
      cover: StoreknoxCover,
      indicator: StoreknoxIndicator,
    },

    access.showsOffensiveSecurity && {
      id: 'offensive-security',
      title: getProductFeatureName('offensive-security', access.isAppknoxUrl),
      description: akMT('offensiveSecurity.homeCardDescription'),
      destination: { kind: 'route', to: '/dashboard/offensive-security' },
      cover: OffensiveSecurityCover,
      indicator: OffensiveSecurityIndicator,
    },

    /* Reporting is sold, so a self-hosted install is never offered it. */
    access.hasReporting &&
      !access.isEnterprise && {
        id: 'reporting',
        title: getProductFeatureName('reporting', access.isAppknoxUrl),
        description: akMT('reportModule.description'),
        destination: { kind: 'route', to: '/dashboard/reports' },
        cover: ReportCover,
        indicator: ReportIndicator,
      },

    access.hasSecurityPermission && {
      id: 'security',
      title: getProductFeatureName('security', access.isAppknoxUrl),
      description: akMT('securityDashboardDesc'),
      destination: { kind: 'app', href: '/security/projects' },
      cover: SecurityCover,
      indicator: SecurityIndicator,
      opensInNewTab: true,
    },
  ];

  return entries.filter(Boolean) as ProductFeature[];
};

/*
  Which product a path belongs to. The Appknox dashboard holds every path that
  is not one of these, so it is what an unmatched path falls back to.
*/
const PRODUCT_FEATURE_PATHS: Array<[string, ProductFeatureId]> = [
  ['/dashboard/storeknox', 'storeknox'],
  ['/dashboard/offensive-security', 'offensive-security'],
  ['/dashboard/reports', 'reporting'],
  ['/security', 'security'],
];

/**
 * Whether a path is the product's own page or one beneath it.
 *
 * The next character has to be a separator, so `/dashboard/store-release-readiness`
 * is not read as a page of StoreKnox.
 *
 * @param pathname - Where the router currently is.
 * @param prefix - The product's entry path.
 * @returns Whether the path belongs to that product.
 */
const isWithinProduct = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

/**
 * The product the page being shown belongs to, including every page beneath it.
 *
 * @param pathname - Where the router currently is.
 * @returns The product that page is part of.
 */
export const getProductFeatureIdForPath = (pathname: string): ProductFeatureId =>
  PRODUCT_FEATURE_PATHS.find(([prefix]) => isWithinProduct(pathname, prefix))?.[1] ?? 'appknox';
