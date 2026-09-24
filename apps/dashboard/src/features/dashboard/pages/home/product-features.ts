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

/** One product feature the account may open from the home page. */
interface ProductFeature {
  id: string;
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
  hasOffensiveSecurity: boolean;
  hasReporting: boolean;
  hasSecurityPermission: boolean;
  isEnterprise: boolean;
  isAppknoxUrl: boolean;

  /** Set when the organization lacks offensive security and is shown no upsell for it. */
  hidesOffensiveSecurityUpsell: boolean;
}

/** The product features this account may open, in the order they are shown. */
export const buildProductFeatures = (access: ProductFeatureAccess): ProductFeature[] => {
  const entries: Array<ProductFeature | false> = [
    {
      id: 'appknox',
      title: access.isAppknoxUrl ? akMT('appknox') : akMT('vapt'),
      description: akMT('appknoxDesc'),
      destination: { kind: 'route', to: '/dashboard/projects' },
      cover: AppknoxCover,
      indicator: VaptIndicator,
    },

    access.hasStoreknox && {
      id: 'storeknox',
      title: access.isAppknoxUrl ? akMT('storeknox.title') : akMT('appMonitoring'),
      description: akMT('storeknox.description'),
      destination: { kind: 'route', to: '/dashboard/storeknox/inventory/app-list' },
      cover: StoreknoxCover,
      indicator: StoreknoxIndicator,
    },

    !access.hidesOffensiveSecurityUpsell &&
      access.hasOffensiveSecurity && {
        id: 'offensive-security',
        title: akMT('offensiveSecurity.title'),
        description: akMT('offensiveSecurity.homeCardDescription'),
        destination: { kind: 'route', to: '/dashboard/offensive-security' },
        cover: OffensiveSecurityCover,
        indicator: OffensiveSecurityIndicator,
      },

    /* Reporting is sold, so a self-hosted install is never offered it. */
    access.hasReporting &&
      !access.isEnterprise && {
        id: 'reporting',
        title: akMT('reportModule.title'),
        description: akMT('reportModule.description'),
        destination: { kind: 'route', to: '/dashboard/reports' },
        cover: ReportCover,
        indicator: ReportIndicator,
      },

    access.hasSecurityPermission && {
      id: 'security',
      title: akMT('securityDashboard'),
      description: akMT('securityDashboardDesc'),
      destination: { kind: 'app', href: '/security/projects' },
      cover: SecurityCover,
      indicator: SecurityIndicator,
      opensInNewTab: true,
    },
  ];

  return entries.filter(Boolean) as ProductFeature[];
};
