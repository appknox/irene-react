/*
  What a test needs and production code must not have: a transport that reaches
  nothing, and the resets that keep one test's listeners and connections out of
  the next.
*/

import type { WebsocketChannel, WebsocketTransport } from '@irene/websocket/types';

export { WEBSOCKET_EVENTS, WEBSOCKET_NOTIFY_TYPE } from '@irene/websocket/events';

export {
  closeWebsocketConnection,
  getWebsocketConnection,
  openWebsocketConnection,
  setWebsocketTransport,
} from '@irene/websocket/connection';

export { clearWebsocketSignals } from '@irene/websocket/signals';
export { releaseAllDeviceSessions } from '@irene/websocket/streams';

/** A transport that opens nothing, and plays the server's events itself. */
export interface FakeWebsocketTransport extends WebsocketTransport {
  /** The room the connection was opened for, or nothing if none was. */
  readonly room: string | undefined;

  /** Plays an event through whatever is listening, as the server would. */
  emit: (event: string, payload?: unknown) => void;
}

/**
 * A transport for tests, which reaches no network.
 *
 * Install it with `setWebsocketTransport` so nothing opens a socket, then use
 * `emit` to play the events a test is about.
 *
 * @returns The transport, with the room it opened and a way to send events.
 */
export function createFakeWebsocketTransport(): FakeWebsocketTransport {
  const handlers = new Map<string, Set<(payload: unknown) => void>>();

  let openedRoom: string | undefined;

  const channel: WebsocketChannel = {
    on(event, handler) {
      handlers.set(event, (handlers.get(event) ?? new Set()).add(handler));
    },

    off(event, handler) {
      handlers.get(event)?.delete(handler);
    },

    close() {
      handlers.clear();
      openedRoom = undefined;
    },
  };

  return {
    open(room) {
      openedRoom = room;

      return channel;
    },

    get room() {
      return openedRoom;
    },

    emit(event, payload) {
      [...(handlers.get(event) ?? [])].forEach((handler) => handler(payload));
    },
  };
}
