import { Outlet } from '@tanstack/react-router';

import { isPluginEnabled } from '@irene/config';

import { SideNav } from '@/components/side-nav';
import { useOrganization } from '@/hooks/use-organization';
import { useServerConfiguration } from '@/hooks/use-server-configuration';
import { useSidebarState } from '@/hooks/use-sidebar-state';

import { buildDashboardNavItems } from './nav-items';

// The key is prefixed with "irene-" to avoid conflicts with other apps.
const SIDEBAR_STATE_KEY = 'irene-dashboard-sidebar-state';

/**
 * The chrome every dashboard page sits in: the navigation beside the page, and
 * the page itself scrolling on its own so the navigation stays put.
 *
 * The landing page is not one of these. It offers the products an account may
 * open, so it fills the window and carries no navigation into them.
 */
export function DashboardLayout() {
  const { isCollapsed, toggle } = useSidebarState(SIDEBAR_STATE_KEY);
  const { isEnterprise } = useServerConfiguration();

  const organization = useOrganization();
  const features = organization.features();
  const upsellStatus = organization.upsellStatus();

  /* The dashboard's own items. Each product's chrome builds its own list. */
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

  return (
    <div className="flex h-screen w-full overflow-hidden" data-test-dashboard-layout>
      <SideNav items={items} isCollapsed={isCollapsed} onSidebarToggle={toggle} />

      <main className="flex-1 overflow-y-auto bg-background-subtle" data-test-dashboard-main>
        <Outlet />
      </main>
    </div>
  );
}
