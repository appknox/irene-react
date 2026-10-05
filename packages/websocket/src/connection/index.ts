import { io, type Socket } from 'socket.io-client';

import { configurationStore } from '@irene/api/stores/configuration';
import type { WebsocketTransport } from '@irene/websocket/types';

/*
  The connection to the websocket server.

  The server speaks Socket.IO rather than plain WebSocket, so the handshake and
  the framing come from its own client. The host is whatever the deployment
  reports, and the path is fixed: the server mounts at /websocket.
*/

/** Where the server mounts, which is not the host's root. */
const SOCKET_PATH = '/websocket';

/** The event that puts this connection in the account's room. */
const SUBSCRIBE_EVENT = 'subscribe';

let socket: Socket | null = null;

/**
 * Opens the connection, or hands back the one already open.
 *
 * One connection serves the session: the server fans every product's events
 * into the same room, so a second would only duplicate them.
 *
 * @param socketId - The account's room, which the server publishes to.
 * @returns The connection, which the caller subscribes to events on.
 */
export function openWebsocketConnection(socketId: string): Socket {
  if (socket) {
    return socket;
  }

  // Create a new socket connection.
  socket = io(configurationStore.getState().socketHost(), {
    path: SOCKET_PATH,
    transports: ['websocket', 'polling'],
  });

  /* The room is joined on every connect, so a reconnection does not land outside it. */
  socket.on('connect', () => {
    socket?.emit(SUBSCRIBE_EVENT, { room: socketId });
  });

  return socket;
}

/**
 * Closes the connection and forgets it, so the next sign-in opens a new one.
 *
 * The room is the account's, so a connection outliving the session would carry
 * one account's events into the next.
 */
export function closeWebsocketConnection() {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
}

/**
 * The connection, where one is open.
 *
 * @returns The connection, or null before sign-in and after sign-out.
 */
export function getWebsocketConnection(): Socket | null {
  return socket;
}

/**
 * The account's room, carried over Socket.IO.
 *
 * The adapter behind `WebsocketTransport`: the dispatch is wired to this in an
 * app and to a plain object in a test, and knows the difference nowhere.
 */
export const socketIoTransport: WebsocketTransport = {
  open(room) {
    const connection = openWebsocketConnection(room);

    return {
      on: (event, handler) => connection.on(event, handler),
      off: (event, handler) => connection.off(event, handler),
      close: closeWebsocketConnection,
    };
  },
};

/*
  Which transport a connection opens through. Socket.IO in an app; a test
  installs its own so nothing reaches the network, through `@irene/websocket/testing`.
*/
let currentTransport: WebsocketTransport = socketIoTransport;

/** The transport connections open through. */
export function websocketTransport() {
  return currentTransport;
}

/**
 * Replaces the transport connections open through.
 *
 * @param transport - What to open through, or nothing to go back to Socket.IO.
 */
export function setWebsocketTransport(transport?: WebsocketTransport) {
  currentTransport = transport ?? socketIoTransport;
}
