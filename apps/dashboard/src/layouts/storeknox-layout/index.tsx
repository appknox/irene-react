import { useQuery } from '@tanstack/react-query';
import { Outlet } from '@tanstack/react-router';

import { SideNav } from '@/components/side-nav';
import { TopNav } from '@/components/top-nav';
import { OnboardingGuides } from '@/features/onboarding-guides';
import { useSidebarState } from '@/hooks/use-sidebar-state';
import { useSignedInUser } from '@/hooks/use-signed-in-user';
import { storeknoxOrganizationOptions } from '@/queries/organization';
import { STOREKNOX_PENDO_CONTAINER_ID } from '@/scripts/pendo';

import { buildStoreknoxNavItems } from './nav-items';

/**
 * The layout every store monitoring page sits in.
 *
 * Store monitoring is its own product: it renders the shared navigation with
 * its own items, and offers its own walkthroughs. Uploading an app belongs to
 * the VAPT product, so the bar carries none of it.
 */
export function StoreknoxLayout() {
  const { isCollapsed, toggle } = useSidebarState();
  const user = useSignedInUser();

  /* Read at boot and held, so the navigation does not wait on it. */
  const { data: storeknoxOrganization } = useQuery(storeknoxOrganizationOptions());
  const storeknoxFeatures = storeknoxOrganization?.sk_features;

  const items = buildStoreknoxNavItems({
    detectsFakeApps: Boolean(storeknoxFeatures?.fake_app_detection),
    scansThirdPartyApps: Boolean(storeknoxFeatures?.third_party_scanning),
  });

  return (
    <div className="flex h-screen w-full overflow-hidden" data-test-storeknox-layout>
      <SideNav
        items={items}
        isCollapsed={isCollapsed}
        onSidebarToggle={toggle}
        pendoContainerId={STOREKNOX_PENDO_CONTAINER_ID}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav
          username={user.username}
          email={user.email}
          actions={<OnboardingGuides product="storeknox" />}
        />

        <main className="flex-1 overflow-y-auto bg-background-subtle" data-test-storeknox-main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
