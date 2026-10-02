import { API_NAMESPACES } from '@irene/api/namespaces';

/** Paths for the in-app notifications the bell reads. */
export const NotificationEndpoints = {
  list: () => `${API_NAMESPACES.v2}/nf_in_app_notifications` as const,

  /** One notification, which a PATCH marks read or unread. */
  detail: (notificationId: number | string) =>
    `${API_NAMESPACES.v2}/nf_in_app_notifications/${encodeURIComponent(notificationId)}` as const,

  /** Marks every notification read, which is what clears the bell's unread dot. */
  markAllAsRead: () => `${API_NAMESPACES.v2}/nf_in_app_notifications/mark_all_as_read` as const,
};
