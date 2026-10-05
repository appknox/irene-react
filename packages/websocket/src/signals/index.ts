import type { ApiRecordFields, ApiRecordOf, ApiRecordType } from '@irene/api/normalization';
import type { WebsocketCounter } from '@irene/websocket/events';

/**
 * A count changing, named as the subject plus `Counter`.
 *
 * The server sends the model's class name — `Submission` — and the suffix is
 * added here, so a count cannot be mistaken for the record kind of the same
 * name: `SubmissionCounter` is "there are more of these", `submission` is "this
 * one changed".
 */
export type WebsocketCounterSignal = `${WebsocketCounter}Counter`;

/**
 * A subject anything can be told has changed.
 *
 * Both sides raise them: the server when it sends a count, and the client after
 * its own mutation — an upload that creates a submission tells every list of
 * submissions without waiting to be told.
 */
export type WebsocketSignal = WebsocketCounterSignal | ApiRecordType;

type Listener<TValue> = (value: TValue) => void;

/** One subject-keyed set of listeners, which both buses below are. */
function _createWsSignalTransport<TKey, TValue>() {
  const listeners = new Map<TKey, Set<Listener<TValue>>>();

  return {
    publish(key: TKey, value: TValue) {
      [...(listeners.get(key) ?? [])].forEach((listener) => listener(value));
    },

    subscribe(key: TKey, listener: Listener<TValue>) {
      const forKey = listeners.get(key) ?? new Set();

      forKey.add(listener);
      listeners.set(key, forKey);

      return () => {
        forKey.delete(listener);

        if (forKey.size === 0) {
          listeners.delete(key);
        }
      };
    },

    clear: () => listeners.clear(),
  };
}

const signals = _createWsSignalTransport<WebsocketSignal, void>();
const records = _createWsSignalTransport<ApiRecordType, ApiRecordFields>();

/**
 * Tells everything listening that a subject changed.
 *
 * A signal carries nothing: the server sends no payload for a count, and a
 * subscriber already knows what it would reload.
 *
 * @param signal - What changed.
 */
export function raiseWebsocketSignal(signal: WebsocketSignal) {
  signals.publish(signal, undefined);
}

/**
 * Listens for a subject changing.
 *
 * @param signal - What to listen for.
 * @param listener - Called each time it is raised.
 * @returns A function that stops listening.
 */
export function subscribeToWebsocketSignal(signal: WebsocketSignal, listener: () => void) {
  return signals.subscribe(signal, listener);
}

/**
 * Hands a record the server sent to anything listening for that kind.
 *
 * The cache is updated separately and needs no listener. This is for a screen
 * that has to act on the record as well as show it.
 *
 * @param type - The kind of record.
 * @param record - The record as the server sent it.
 */
export function publishWebsocketRecord(type: ApiRecordType, record: ApiRecordFields) {
  records.publish(type, record);
}

/**
 * Listens for records of one kind arriving.
 *
 * The listener is handed that kind's own shape: the server names the kind on
 * the event, and that name is what says which record it is.
 *
 * @param type - The kind of record to listen for.
 * @param listener - Called with each record of that kind.
 * @returns A function that stops listening.
 */
export function subscribeToWebsocketRecords<TType extends ApiRecordType>(
  type: TType,
  listener: (record: ApiRecordOf<TType>) => void
) {
  /* The bus carries every kind, and this subscription is for one of them. */
  return records.subscribe(type, listener as (record: ApiRecordFields) => void);
}

/** Drops every listener, so one test's subscriptions do not reach the next. */
export function clearWebsocketSignals() {
  signals.clear();
  records.clear();
}
