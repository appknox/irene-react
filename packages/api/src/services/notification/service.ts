import { apiRequest } from '@irene/api/request';
import { transformPaginatedResponse } from '@irene/api/utils/transforms';
import type { ApiPageEnvelope } from '@irene/api/utils/pagination';

import { NotificationEndpoints } from './endpoints';
import type { ApiNotification, ApiNotificationListRequest, ApiNotificationProduct } from './types';

/** Talks to the in-app notification endpoints. */
export default class NotificationService {
  /**
   * Fetches a page of a product's notifications, newest first.
   *
   * @param product - Whose notifications to read.
   * @param params - The page size, offset, and whether to return only unread ones.
   * @returns The notifications on the page and the total count.
   */
  public static readonly getNotifications = async (
    product: ApiNotificationProduct,
    params: ApiNotificationListRequest
  ) => {
    const page = await apiRequest.get<ApiPageEnvelope<ApiNotification>>(
      NotificationEndpoints.list(product),
      { params }
    );

    return transformPaginatedResponse(page);
  };

  /**
   * Marks one notification read or unread.
   *
   * @param product - Whose notification it is.
   * @param id - The notification to update.
   * @param hasRead - Whether it now counts as read.
   * @returns The updated notification.
   */
  public static readonly setNotificationRead = (
    product: ApiNotificationProduct,
    id: number,
    hasRead: boolean
  ) =>
    apiRequest.patch<ApiNotification>(NotificationEndpoints.detail(product, id), {
      has_read: hasRead,
    });

  /**
   * Marks every one of a product's notifications read, which clears the bell's unread dot.
   *
   * @param product - Whose notifications to mark.
   */
  public static readonly markAllAsRead = (product: ApiNotificationProduct) =>
    apiRequest.post<void>(NotificationEndpoints.markAllAsRead(product));
}
