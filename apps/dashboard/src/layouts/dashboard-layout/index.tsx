import { Outlet, useRouterState } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { isPluginEnabled } from '@irene/config';

import { SideNav } from '@/components/side-nav';
import { TopNav } from '@/components/top-nav';
import { OnboardingGuides } from '@/features/onboarding-guides';
import { UploadApp } from '@/features/upload-app';
import { useOrganization } from '@/hooks/use-organization';
import { useProductFeatureId } from '@/hooks/use-product-feature-id';
import { useServerConfiguration } from '@/hooks/use-server-configuration';
import { useSidebarState } from '@/hooks/use-sidebar-state';
import { useSignedInUser } from '@/hooks/use-signed-in-user';

import { buildDashboardNavItems } from './nav-items';

/** Where the partner screens live, which share this layout without being the product. */
const PARTNER_DASHBOARD_PATH = '/partner';

/**
 * The layout every dashboard page sits in: the navigation beside the page, and
 * the page itself scrolling on its own so the navigation stays put.
 *
 * The landing page is not one of these. It offers the products an account may
 * open, so it fills the window and carries no navigation into them.
 */
export function DashboardLayout({ children }: Readonly<{ children?: ReactNode }>) {
  const { isCollapsed, toggle } = useSidebarState();
  const { isEnterprise } = useServerConfiguration();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const user = useSignedInUser();
  const organization = useOrganization();
  const features = organization.features();
  const upsellStatus = organization.upsellStatus();

  /* The dashboard's own items. Store monitoring is its own product, with its own. */
  const items = buildDashboardNavItems({
    hasPublicApis: features.public_apis,
    hasPrivacy: features.privacy,
    hasSbom: features.sbom,
    hasStoreReleaseReadiness: features.store_release_readiness,
    hidesPrivacyUpsell: upsellStatus.privacy,
    hidesSbomUpsell: upsellStatus.sbom,
    hidesStoreReleaseReadinessUpsell: upsellStatus.storeReleaseReadiness,
    isEnterprise,
    isAdmin: organization.isAdmin(),
    isOwner: organization.isOwner(),
    billingHidden: organization.billingHidden(),
    showsSubscription: organization.showsSubscription(),
    projectsCount: organization.projectsCount(),
    hasMarketplace: isPluginEnabled('IRENE_ENABLE_MARKETPLACE'),
    canAccessPartnerDashboard: organization.canAccessPartnerDashboard(),
  });

  /*
  The partner screens share this layout without being a product that can be
  scanned, so they offer neither an upload nor the walkthroughs.
  */
  const isPartnerScreen = pathname.startsWith(PARTNER_DASHBOARD_PATH);

  /* Every other product renders a layout of its own, with the bar it needs. */
  const productId = useProductFeatureId();
  const isVaptProduct = !isPartnerScreen && productId === 'appknox';

  return (
    <div className="flex h-screen w-full overflow-hidden" data-test-dashboard-layout>
      <SideNav items={items} isCollapsed={isCollapsed} onSidebarToggle={toggle} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav
          username={user.username}
          email={user.email}
          actions={isVaptProduct && <OnboardingGuides product="appknox" />}
        >
          {isVaptProduct && <UploadApp />}
        </TopNav>

        <main className="flex-1 overflow-y-auto bg-background-subtle" data-test-dashboard-main>
          {children}

          <Outlet />
        </main>
      </div>
    </div>
  );
}
