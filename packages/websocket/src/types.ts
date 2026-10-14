import type { ApiRecordType, ApiRecordWithId } from '@irene/api/normalization';
import type { WebsocketProduct } from '@irene/websocket/events';

/** A record the server sent, which the cache holds under its own id. */
export type WebsocketRecord = ApiRecordWithId;

/** A line of text the server sent for the account to read. */
export interface WebsocketMessage {
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
  isPersistent: boolean;
}

/** How many notifications are unread, and for which product. */
export interface WebsocketUnreadCount {
  count: number;
  product: WebsocketProduct;
}

/** A connection to the account's room, however it is carried. */
export interface WebsocketTransport {
  open: (room: string) => WebsocketChannel;
}

/** What an open connection lets the dispatch do. */
export interface WebsocketChannel {
  on: (event: string, handler: (payload: unknown) => void) => void;
  off: (event: string, handler: (payload: unknown) => void) => void;
  close: () => void;
}

/** Where a record goes, and how the queries holding one are found. */
export interface WebsocketRecordCache {
  write: (type: ApiRecordType, record: WebsocketRecord) => void;
  readQueriesHolding: (type: ApiRecordType, id: string | number) => void;
}

/** The app's handlers for the notices the server sends: a line of text, and how many are unread. */
export interface WebsocketNoticeHandlers {
  onMessage: (message: WebsocketMessage) => void;
  onUnreadCount: (unread: WebsocketUnreadCount) => void;
}
