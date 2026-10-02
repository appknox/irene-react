/** One in-app notification, as the list returns it. */
export interface ApiNotification {
  id: number;
  has_read: boolean;

  /** Which notification this is, which selects how its context is rendered. */
  message_code: string;

  /** The values the message is rendered with. Its shape follows the message code. */
  context: Record<string, unknown>;
  created_on: string;
}

/** What the list is narrowed by. Omitting `has_read` returns both read and unread. */
export interface ApiNotificationListRequest {
  limit: number;
  offset: number;
  has_read?: boolean;
}
