import { Outlet } from '@tanstack/react-router';

import { SideNav } from '@/components/side-nav';
import { TopNav } from '@/components/top-nav';
import { UploadApp } from '@/features/upload-app';
import { useSidebarState } from '@/hooks/use-sidebar-state';
import { useSignedInUser } from '@/hooks/use-signed-in-user';

import { buildOffensiveSecurityNavItems } from './nav-items';

/**
 * The layout every offensive security page sits in.
 *
 * Offensive security is its own product: it renders the shared navigation with
 * its own items. An app uploaded from here joins that product's own queue, so
 * the bar carries the upload section. No walkthroughs are recorded against it.
 */
export function OffensiveSecurityLayout() {
  const { isCollapsed, toggle } = useSidebarState();
  const user = useSignedInUser();

  return (
    <div className="flex h-screen w-full overflow-hidden" data-test-offensive-security-layout>
      <SideNav
        items={buildOffensiveSecurityNavItems()}
        isCollapsed={isCollapsed}
        onSidebarToggle={toggle}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav username={user.username} email={user.email}>
          <UploadApp />
        </TopNav>

        <main
          className="flex-1 overflow-y-auto bg-background-subtle"
          data-test-offensive-security-main
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
