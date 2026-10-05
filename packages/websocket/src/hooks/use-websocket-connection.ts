import { useEffect } from 'react';

import { useNormalizedRecordCache } from '@irene/api/normalization';

import { createWebsocketDispatch } from '@irene/websocket/cache';
import { websocketTransport } from '@irene/websocket/connection';
import type { WebsocketNoticeHandlers, WebsocketTransport } from '@irene/websocket/types';

import { useEventCallback } from './use-event-callback';

/** What an app tells the connection about itself. */
interface WebsocketConnectionOptions {
  socketId: string | null | undefined;
  noticeHandlers: WebsocketNoticeHandlers;
  transport?: WebsocketTransport;
}

/**
 * Opens the account's connection, and keeps the cache in step while it is open.
 *
 * An app calls this once, from the layout every signed-in page renders inside.
 * The room is the account's, so nothing opens until the account has loaded and
 * the connection closes with the session rather than carrying one account's
 * events into the next.
 *
 * Pages do not call this. They use `useWebsocketSignal` or `useWebsocketRecord` —
 * or nothing at all, and their rows update themselves.
 *
 * @param options.socketId - The room the account's events arrive in.
 * @param options.noticeHandlers - What this app does with a message and an unread count.
 * @param options.transport - How the room is carried. The installed transport unless a caller names one.
 */
export function useWebsocketConnection({
  socketId,
  noticeHandlers,
  transport = websocketTransport(),
}: WebsocketConnectionOptions) {
  const cache = useNormalizedRecordCache();

  // Wrap the handlers in event callbacks to avoid re-rendering the component when the handlers change.
  const onMessage = useEventCallback(noticeHandlers.onMessage);
  const onUnreadCount = useEventCallback(noticeHandlers.onUnreadCount);

  useEffect(() => {
    // No socket id means the account is not signed in, or the server named no room.
    if (!socketId) {
      return;
    }

    // Create the channel and the event handlers.
    const channel = transport.open(socketId);
    const noticeHandlers = { onMessage, onUnreadCount };
    const dispatch = createWebsocketDispatch({ cache, noticeHandlers });

    const listenForEvents = (
      register: (event: string, handler: (payload: unknown) => void) => void
    ) => Object.entries(dispatch.handlers).forEach(([event, handler]) => register(event, handler));

    // Listen for events on the channel.
    listenForEvents(channel.on);

    return () => {
      dispatch.stop();
      listenForEvents(channel.off);
      channel.close();
    };
  }, [cache, onMessage, onUnreadCount, socketId, transport]);
}
