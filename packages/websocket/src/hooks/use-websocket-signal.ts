import { useEffect } from 'react';

import { subscribeToWebsocketSignal, type WebsocketSignal } from '@irene/websocket/signals';

import { useEventCallback } from './use-event-callback';

/**
 * Runs something whenever a subject is reported changed.
 *
 * How a screen reacts to a change the server described rather than sent: a
 * count moved, a record was created. The subject is named, not the query, so a
 * page says what it cares about and nothing central knows which pages exist.
 *
 * @param signal - What to listen for.
 * @param onSignal - What to do when it is raised.
 */
export function useWebsocketSignal(signal: WebsocketSignal, onSignal: () => void) {
  const listener = useEventCallback(onSignal);
  useEffect(() => subscribeToWebsocketSignal(signal, listener), [signal, listener]);
}
