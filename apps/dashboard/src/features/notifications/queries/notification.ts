import { queryOptions } from '@tanstack/react-query';
import { NotificationService } from '@irene/api/services/notification';

/** How many unread notifications the bell's dropdown lists. */
export const UNREAD_NOTIFICATION_LIMIT = 7;

/** The cache keys for in-app notifications. */
export const notificationKeys = {
  all: () => ['notification'] as const,
  unread: () => [...notificationKeys.all(), 'unread'] as const,
};

/**
 * Builds the query behind the bell: the newest unread notifications and how many there are.
 *
 * @returns Query options resolving to a page of unread notifications.
 */
export const unreadNotificationsOptions = () =>
  queryOptions({
    queryKey: notificationKeys.unread(),
    queryFn: () =>
      NotificationService.getNotifications({
        limit: UNREAD_NOTIFICATION_LIMIT,
        offset: 0,
        has_read: false,
      }),
  });
