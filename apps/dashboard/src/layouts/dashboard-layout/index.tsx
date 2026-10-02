import { Outlet } from '@tanstack/react-router';

import { isPluginEnabled } from '@irene/config';

import { SideNav } from '@/components/side-nav';
import { TopNav } from '@/components/top-nav';
import { useOrganization } from '@/hooks/use-organization';
import { useServerConfiguration } from '@/hooks/use-server-configuration';
import { useSidebarState } from '@/hooks/use-sidebar-state';
import { useSignedInUser } from '@/hooks/use-signed-in-user';

import { buildDashboardNavItems } from './nav-items';

/**
 * The layout every dashboard page sits in: the navigation beside the page, and
 * the page itself scrolling on its own so the navigation stays put.
 *
 * The landing page is not one of these. It offers the products an account may
 * open, so it fills the window and carries no navigation into them.
 */
export function DashboardLayout() {
  const { isCollapsed, toggle } = useSidebarState();
  const { isEnterprise } = useServerConfiguration();

  const user = useSignedInUser();
  const organization = useOrganization();
  const features = organization.features();
  const upsellStatus = organization.upsellStatus();

  /* The dashboard's own items. Each product's layout builds its own list. */
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

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav username={user?.username ?? ''} email={user?.email ?? ''} />

        <main className="flex-1 overflow-y-auto bg-background-subtle" data-test-dashboard-main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
