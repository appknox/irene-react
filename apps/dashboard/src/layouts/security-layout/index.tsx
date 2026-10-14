import { Outlet } from '@tanstack/react-router';
import { useMemo } from 'react';

import { akMT } from '@irene/translations/intl';
import type { IconName } from '@irene/ui/icons/sets';

import { SideNav } from '@/components/side-nav';
import { TopNav } from '@/components/top-nav';
import { useSidebarState } from '@/hooks/use-sidebar-state';
import { useSignedInUser } from '@/hooks/use-signed-in-user';
import type { SideNavItemDefinition } from '@/components/side-nav/nav-item';
import type { FileRouteTypes } from '@/routeTree.gen';

/* Every page beneath the security dashboard, read from the generated tree. */
type SecurityNavRoute = Extract<FileRouteTypes['to'], `/security/${string}`>;

/** One entry in the security navigation, narrowed to the routes it leads to. */
interface SecurityNavItem extends SideNavItemDefinition {
  icon: IconName;
  to: SecurityNavRoute;
}

/**
 * The layout every security dashboard page sits in.
 *
 * The security dashboard is its own product: it renders the shared navigation
 * with its own items, and the switcher leads back to the dashboard. It keeps
 * no notifications of its own, so the bar carries no bell.
 */
export function SecurityLayout() {
  const { isCollapsed, toggle } = useSidebarState();
  const user = useSignedInUser();

  /*
    Every page is offered to anyone who reaches the product: the permission to
    open it at all is what gates them.
  */
  const items = useMemo<SecurityNavItem[]>(
    () => [
      {
        id: 'security-projects',
        label: akMT('allProjects'),
        icon: 'material-symbols:folder',
        to: '/security/projects',
      },

      {
        id: 'security-download-app',
        label: akMT('securityModule.downloadApp'),
        icon: 'material-symbols:download',
        to: '/security/download-app',
      },

      {
        id: 'security-purge-analysis',
        label: akMT('securityModule.purgeApiAnalyses'),
        icon: 'material-symbols:delete',
        to: '/security/purge-analysis',
      },
    ],
    []
  );

  return (
    <div className="flex h-screen w-full overflow-hidden" data-test-security-layout>
      <SideNav items={items} isCollapsed={isCollapsed} onSidebarToggle={toggle} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav username={user.username} email={user.email} showNotifications={false} />

        <main className="flex-1 overflow-y-auto bg-background-subtle" data-test-security-main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
