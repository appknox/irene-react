import { API_NAMESPACES } from '@irene/api/namespaces';
import type { ApiNotificationProduct } from './types';

/** Where each product's notifications are served from. */
const NOTIFICATION_PATHS: Record<ApiNotificationProduct, string> = {
  appknox: `${API_NAMESPACES.v2}/nf_in_app_notifications` as const,
  storeknox: `${API_NAMESPACES.v2}/sk_nf_in_app_notifications` as const,
};

/**
 * Paths for the in-app notifications the bell reads.
 *
 * Each product keeps its own, so the bell shows what belongs to the product
 * the account is looking at rather than everything at once.
 */
export const NotificationEndpoints = {
  list: (product: ApiNotificationProduct) => NOTIFICATION_PATHS[product],

  /** One notification, which a PATCH marks read or unread. */
  detail: (product: ApiNotificationProduct, notificationId: number | string) =>
    `${NOTIFICATION_PATHS[product]}/${encodeURIComponent(notificationId)}` as const,

  /** Marks every notification read, which is what clears the bell's unread dot. */
  markAllAsRead: (product: ApiNotificationProduct) =>
    `${NOTIFICATION_PATHS[product]}/mark_all_as_read`,
};
