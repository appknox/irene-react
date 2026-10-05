import { queryOptions } from '@tanstack/react-query';
import { NotificationService, type ApiNotificationProduct } from '@irene/api/services/notification';

/** How many unread notifications the bell's dropdown lists. */
export const UNREAD_NOTIFICATION_LIMIT = 7;

/**
 * The cache keys for in-app notifications.
 *
 * Keyed by product, because each keeps its own: switching to store monitoring
 * reads its notifications rather than the ones already held for Appknox.
 */
export const notificationKeys = {
  all: () => ['notification'] as const,
  product: (product: ApiNotificationProduct) => [...notificationKeys.all(), product] as const,
  unread: (product: ApiNotificationProduct) =>
    [...notificationKeys.product(product), 'unread'] as const,
};

/**
 * Builds the query behind the bell: the newest unread notifications and how many there are.
 *
 * @param product - Whose notifications to read.
 * @returns Query options resolving to a page of unread notifications.
 */
export const unreadNotificationsOptions = (product: ApiNotificationProduct) =>
  queryOptions({
    queryKey: notificationKeys.unread(product),
    queryFn: () =>
      NotificationService.getNotifications(product, {
        limit: UNREAD_NOTIFICATION_LIMIT,
        offset: 0,
        has_read: false,
      }),
  });
