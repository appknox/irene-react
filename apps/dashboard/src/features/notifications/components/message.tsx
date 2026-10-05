import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId } from 'react';

import { patchPaginationItem } from '@irene/api/normalization';
import { NotificationService, type ApiNotification } from '@irene/api/services/notification';
import { AkTypography } from '@irene/ui/ak-typography';

import { unreadNotificationsOptions } from '@/features/notifications/queries/notification';
import { useProductNotifications } from '@/hooks/use-product-notifications';
import { formatRelativeTime } from '@/utils/relative-time';

import { NotificationErrorMessage } from './messages/error';
import { NOTIFICATION_MAP, type NotificationCode } from './notification-map';

interface NotificationMessageProps {
  notification: ApiNotification;
}

/**
 * One row of the notification list: the message, when it arrived, and whether it has been read.
 *
 * The toggle is filled while the notification is unread, which is how the list
 * is scanned: a filled dot marks what is still outstanding.
 *
 * @param props.notification - The notification this row states.
 */
export function NotificationMessage({ notification }: Readonly<NotificationMessageProps>) {
  const queryClient = useQueryClient();
  const product = useProductNotifications();

  /* Updates the row in place so a notification marked read stays on the list until it is reopened. */
  const setRead = useMutation({
    mutationFn: (hasRead: boolean) =>
      NotificationService.setNotificationRead(product, notification.id, hasRead),

    onMutate: async (hasRead) => {
      const { queryKey } = unreadNotificationsOptions(product);

      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (page) =>
        patchPaginationItem(page, notification.id, { has_read: hasRead })
      );

      return { previous };
    },

    onError: (_error, _hasRead, context) => {
      const queryKey = unreadNotificationsOptions(product).queryKey;
      queryClient.setQueryData(queryKey, context?.previous);
    },
  });

  /* Scoped to the component, not the notification id, which the notifications page will render twice. */
  const toggleId = useId();
  const isUnread = !notification.has_read;
  const relativeTime = formatRelativeTime(notification.created_on);

  return (
    <div
      className="group flex w-full flex-row gap-1.75 p-3.5 hover:bg-neutral-50"
      data-test-notification-message
    >
      <div className="flex-auto text-foreground">
        <MessageBody notification={notification} />

        <AkTypography className="mt-1.5 text-sm text-neutral-400" data-test-notification-created-on>
          {relativeTime}
        </AkTypography>
      </div>

      <span className="m-1.75 flex h-full">
        <input
          id={toggleId}
          type="checkbox"
          checked={isUnread}
          disabled={setRead.isPending}
          aria-label={notification.message_code}
          onChange={(e) => setRead.mutate(!e.target.checked)}
          className="peer size-0 opacity-0"
          data-test-notification-read-toggle
        />

        <label
          htmlFor={toggleId}
          aria-label={notification.message_code}
          className={`
            relative size-1.75 shrink-0 cursor-pointer rounded-full
            before:absolute before:-top-1.75 before:-left-1.75 before:size-5.25 before:rounded-full
            before:border before:border-secondary before:opacity-0
            hover:before:opacity-10
            peer-checked:bg-secondary
            peer-focus-visible:before:opacity-10
            peer-disabled:cursor-not-allowed
            group-hover:before:opacity-10
          `}
          data-test-notification-read-toggle-label
        />
      </span>
    </div>
  );
}

/**
 * Renders a notification through the component registered for its code.
 *
 * A code this build has no component for renders the error message, which
 * states the code rather than the notification.
 *
 * @param props.notification - The notification to render.
 */
function MessageBody({ notification }: Readonly<NotificationMessageProps>) {
  const code = notification.message_code;

  if (!(code in NOTIFICATION_MAP)) {
    return <NotificationErrorMessage messageCode={code} />;
  }

  return NOTIFICATION_MAP[code as NotificationCode](notification.context, code);
}
