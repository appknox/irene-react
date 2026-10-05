import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Fragment } from 'react';

import { NotificationService } from '@irene/api/services/notification';
import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkButton } from '@irene/ui/ak-button';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkTypography } from '@irene/ui/ak-typography';
import NotificationEmptyIllustration from '@irene/ui/svgs/notification-empty.svg?react';

import {
  notificationKeys,
  unreadNotificationsOptions,
} from '@/features/notifications/queries/notification';

import { useProductNotifications } from '@/hooks/use-product-notifications';

import { NotificationsLoadingSkeleton } from './loading-skeleton';
import { NotificationMessage } from './message';

interface NotificationsDropdownProps {
  onNavigate: () => void;
}

/**
 * The panel the bell opens: the newest unread notifications, with a way to
 * clear them and a way to see the rest.
 *
 * @param props.onNavigate - Closes the panel when the footer link moves the page on.
 */
export function NotificationsDropdown({ onNavigate }: Readonly<NotificationsDropdownProps>) {
  const product = useProductNotifications();
  const { data, isPending } = useQuery(unreadNotificationsOptions(product));
  const notifications = data?.items ?? [];

  return (
    <div className="flex w-full flex-col" data-test-notification-dropdown>
      <DropdownHeader unreadCount={data?.count ?? 0} />

      <main className="flex max-h-[70vh] min-h-105 flex-col overflow-y-auto">
        <AkDivider />

        {isPending && <NotificationsLoadingSkeleton />}

        {!isPending && notifications.length === 0 && (
          <div
            className="flex w-full flex-col items-center pb-15.75 mt-17.5"
            data-test-notifications-empty
          >
            <NotificationEmptyIllustration aria-hidden="true" />

            <AkTypography fontWeight="medium" variant="h6" className="my-4">
              <AkMessageTranslate id="notificationModule.noUnreadNotifications" />
            </AkTypography>
          </div>
        )}

        {notifications.map((notification, index) => (
          <Fragment key={notification.id}>
            {index > 0 && <AkDivider />}

            <NotificationMessage notification={notification} />
          </Fragment>
        ))}
      </main>

      <footer className="flex items-center justify-center border-t border-divider py-3.5">
        <Link
          to="/dashboard/notifications"
          onClick={onNavigate}
          className="font-bold text-primary underline"
          data-test-notification-dropdown-link
        >
          <AkMessageTranslate id="notificationModule.viewAllNotifications" />
        </Link>
      </footer>
    </div>
  );
}

/** States the count and clears it, above the list. */
function DropdownHeader({ unreadCount }: Readonly<{ unreadCount: number }>) {
  const queryClient = useQueryClient();
  const product = useProductNotifications();

  const markAllAsRead = useMutation({
    mutationFn: () => NotificationService.markAllAsRead(product),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.product(product) }),
  });

  return (
    <header className="flex w-full items-center justify-between p-3.5">
      <div className="flex items-center">
        <AkTypography variant="h4" className="mr-1.75">
          <AkMessageTranslate id="notifications" />
        </AkTypography>

        <AkTypography
          variant="h5"
          className="bg-primary/10 px-1.5 py-1 leading-none text-primary"
          data-test-unread-count
        >
          {unreadCount}
        </AkTypography>
      </div>

      <AkButton
        variant="text"
        color="primary"
        disabled={markAllAsRead.isPending}
        onClick={() => markAllAsRead.mutate()}
        data-test-mark-all-as-read
      >
        <AkTypography color="inherit" className="font-bold underline">
          <AkMessageTranslate id="notificationModule.markAllAsRead" />
        </AkTypography>
      </AkButton>
    </header>
  );
}
