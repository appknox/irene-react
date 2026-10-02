import { type ReactNode } from 'react';

import { AkAppbar } from '@irene/ui/ak-appbar';
import { NotificationsBell } from '@/features/notifications';

import { KnowledgeBase } from './knowledge-base';
import { ProfileMenu } from './profile-menu';

interface TopNavProps {
  username: string;
  email: string;
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
 * @param props.children - The product's own controls, laid out from the left.
 */
export function TopNav({ username, email, children }: Readonly<TopNavProps>) {
  return (
    <AkAppbar color="default" elevation className="h-14 shrink-0 gap-6 py-2.25" data-test-top-nav>
      <div className="flex flex-1 items-stretch justify-between gap-6 self-stretch">
        <div className="flex items-center gap-3.5">{children}</div>

        <div className="flex items-center gap-2">
          <KnowledgeBase />
        </div>
      </div>

      <div className="flex items-center gap-6 self-stretch">
        <NotificationsBell />

        <ProfileMenu username={username} email={email} />
      </div>
    </AkAppbar>
  );
}
