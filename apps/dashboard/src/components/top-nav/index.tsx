import { type ReactNode } from 'react';

import { AkAppbar } from '@irene/ui/ak-appbar';
import { NotificationsBell } from '@/features/notifications';

import { KnowledgeBase } from './knowledge-base';
import { ProfileMenu } from './profile-menu';

interface TopNavProps {
  username: string;
  email: string;
  showNotifications?: boolean;
  actions?: ReactNode;
  children?: ReactNode;
}

/**
 * The bar across the top of every signed-in page.
 *
 * What sits on the left belongs to the product, so each layout passes its own.
 * The knowledge base closes that row, and the account's menu sits apart from it
 * on the right; both are the same wherever the bar renders.
 *
 * @param props.username - The signed-in account's name.
 * @param props.email - The address it signed in with.
 * @param props.showNotifications - Whether to offer the bell, which not every product has.
 * @param props.actions - The product's own controls, beside the knowledge base.
 * @param props.children - The product's own controls, laid out from the left.
 */
export function TopNav({
  username,
  email,
  showNotifications = true,
  actions,
  children,
}: Readonly<TopNavProps>) {
  return (
    <AkAppbar
      color="default"
      elevation
      className="h-14 shrink-0 gap-2.75 py-2.25"
      data-test-top-nav
    >
      <div className="flex flex-1 items-stretch justify-between gap-2.75 self-stretch">
        <div className="flex items-center gap-2.75">{children}</div>

        <div className="flex items-center gap-2.75">
          {actions}

          <KnowledgeBase />
        </div>
      </div>

      <div className="flex items-center gap-2.75 self-stretch">
        {showNotifications && <NotificationsBell />}

        <ProfileMenu username={username} email={email} />
      </div>
    </AkAppbar>
  );
}
