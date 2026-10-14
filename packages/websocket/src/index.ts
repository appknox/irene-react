/*
  Live data: what the server sends on its own, what has to be read on a
  schedule instead, and connections to a device that outlive a screen.

  Each layer imports only the ones above it:
    events      the socket's contract — names, payload shapes, guards
    types       what the policy acts through, so nothing inside it does I/O
    signals     the bus — named subjects, and records as they arrive
    cache       the policy, and the react-query adapter behind it
    connection  the Socket.IO adapter
    polling     for what the server changes without saying so
    streams     device connections, which are per device and not per account
    hooks       what an app and its pages call

  What is exported here is what an app may use. The policy and the socket
  itself are reachable only from inside, and the resets a test needs are in
  `@irene/websocket/testing`. How a record is keyed belongs to the cache it is
  keyed in, so `NORMALIZER_CONFIG` comes from `@irene/api/normalization`.
*/

export { closeWebsocketConnection } from './connection';
export { WEBSOCKET_PRODUCTS } from './events';
export type { WebsocketProduct } from './events';
export type { WebsocketMessage, WebsocketNoticeHandlers, WebsocketUnreadCount } from './types';

export { useWebsocketConnection, useWebsocketRecord, useWebsocketSignal } from './hooks';
export { raiseWebsocketSignal } from './signals';
export type { WebsocketSignal } from './signals';

export { DEFAULT_POLL_ATTEMPTS, pollUntil } from './polling';

export {
  deviceStreamUrl,
  heldDeviceSession,
  holdDeviceSession,
  releaseAllDeviceSessions,
  releaseDeviceSession,
} from './streams';
