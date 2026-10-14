import { useEffect } from 'react';

import { subscribeToWebsocketRecords } from '@irene/websocket/signals';
import type { ApiRecordOf, ApiRecordType } from '@irene/api/normalization';

import { useEventCallback } from './use-event-callback';

/**
 * Runs something each time the server sends a record of one kind.
 *
 * Every query holding the record is updated without this, so a screen needs it
 * only to do something *besides* show the new values: move a row between lists,
 * open a drawer, reconcile a sequence of scans. It reads the connection's own
 * stream, not the socket, so mounting before or after it opened both work.
 *
 * @param type - The kind of record to listen for.
 * @param onRecordUpdate - Called with each record of that kind, typed by that kind.
 */
export function useWebsocketRecord<TType extends ApiRecordType>(
  type: TType,
  onRecordUpdate: (record: ApiRecordOf<TType>) => void
) {
  const listener = useEventCallback(onRecordUpdate);
  useEffect(() => subscribeToWebsocketRecords(type, listener), [type, listener]);
}
