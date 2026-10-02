import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkPopover, AkPopoverContent, AkPopoverTrigger } from '@irene/ui/ak-popover';

import { unreadNotificationsOptions } from '@/features/notifications/queries/notification';

import { NotificationsDropdown } from './dropdown';

/**
 * The bell in the top bar, marked when anything is unread.
 *
 * The count is loaded with the bar rather than on opening, since the dot is
 * what tells the account there is anything to open.
 */
export function NotificationsBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { data, refetch: loadUnreadNotifications } = useQuery(unreadNotificationsOptions());
  const unreadCount = data?.count ?? 0;

  const handleOpenNotifPopover = (open: boolean) => {
    setIsOpen(open);

    /* The list is read again on every open, so it never states a stale count. */
    if (open) {
      loadUnreadNotifications();
    }
  };

  return (
    <AkPopover open={isOpen} onOpenChange={handleOpenNotifPopover}>
      <AkPopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center relative cursor-pointer text-foreground "
          title={akMT('notifications')}
          aria-label={akMT('notifications')}
          data-test-notifications-bell
        >
          <AkIcon name="material-symbols:notifications" className="size-5.25" />

          {unreadCount > 0 && (
            <span
              className={`
                absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background
                bg-danger
              `}
              data-test-notifications-unread-dot
            />
          )}
        </button>
      </AkPopoverTrigger>

      <AkPopoverContent
        arrow
        align="end"
        sideOffset={10}
        className="w-122.5 border-border p-0 shadow-9"
      >
        <NotificationsDropdown onNavigate={() => setIsOpen(false)} />
      </AkPopoverContent>
    </AkPopover>
  );
}
