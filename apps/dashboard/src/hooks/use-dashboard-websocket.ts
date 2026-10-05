import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
  useWebsocketConnection,
  WEBSOCKET_PRODUCTS,
  type WebsocketNoticeHandlers,
} from '@irene/websocket';

import { akNotify } from '@irene/ui/notify';
import type { ApiNotification } from '@irene/api/services/notification';
import type { ApiPage } from '@irene/api/utils/pagination';

import { notificationKeys } from '@/features/notifications/queries/notification';
import { useSignedInUser } from '@/hooks/use-signed-in-user';

/**
 * Opens this app's websocket connection for as long as the account is signed in.
 *
 * It supplies what the shared connection cannot know: the room the account's
 * events arrive in, and how this app shows the notices that arrive in it — a
 * toast through the design system, and the count its own bell reads.
 */
export function useDashboardWebsocket() {
  const queryClient = useQueryClient();
  const socketId = useSignedInUser()?.socket_id;

  const noticeHandlers = useMemo<WebsocketNoticeHandlers>(
    () => ({
      onMessage: ({ message, level, isPersistent }) =>
        akNotify[level](message, isPersistent ? { duration: Infinity } : {}),

      /* Each product counts its own, so the count lands on the bell that reads that product. */
      onUnreadCount: ({ count, product }) => {
        const targetProduct = product === WEBSOCKET_PRODUCTS.storeknox ? 'storeknox' : 'appknox';

        queryClient.setQueryData<ApiPage<ApiNotification>>(
          notificationKeys.unread(targetProduct),
          (unread) => (unread ? { ...unread, count } : unread)
        );
      },
    }),
    [queryClient]
  );

  // Open the connection and supply the handlers.
  useWebsocketConnection({ socketId, noticeHandlers });
}
