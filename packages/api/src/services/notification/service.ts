import { apiRequest } from '@irene/api/request';
import { transformPaginatedResponse } from '@irene/api/utils/transforms';
import type { ApiPageEnvelope } from '@irene/api/utils/pagination';

import { NotificationEndpoints } from './endpoints';
import type { ApiNotification, ApiNotificationListRequest } from './types';

/** Talks to the in-app notification endpoints. */
export default class NotificationService {
  /**
   * Fetches a page of notifications, newest first.
   *
   * @param params - The page size, offset, and whether to return only unread ones.
   * @returns The notifications on the page and the total count.
   */
  public static readonly getNotifications = async (params: ApiNotificationListRequest) => {
    const page = await apiRequest.get<ApiPageEnvelope<ApiNotification>>(
      NotificationEndpoints.list(),
      { params }
    );

    return transformPaginatedResponse(page);
  };

  /**
   * Marks one notification read or unread.
   *
   * @param id - The notification to update.
   * @param hasRead - Whether it now counts as read.
   * @returns The updated notification.
   */
  public static readonly setNotificationRead = (id: number, hasRead: boolean) =>
    apiRequest.patch<ApiNotification>(NotificationEndpoints.detail(id), { has_read: hasRead });

  /** Marks every notification read, which is what clears the bell's unread dot. */
  public static readonly markAllAsRead = () =>
    apiRequest.post<void>(NotificationEndpoints.markAllAsRead());
}
