import {
  getRecordCacheKey,
  isApiRecordType,
  type ApiRecordFields,
  type ApiRecordType,
} from '@irene/api/normalization';

import {
  hasWebsocketKeys,
  isWebsocketCounter,
  WEBSOCKET_EVENTS,
  WEBSOCKET_NOTIFY_TYPE,
  type WebsocketCounterPayload,
  type WebsocketMessagePayload,
  type WebsocketNotificationPayload,
  type WebsocketNotifyType,
  type WebsocketObjectPayload,
  type WebsocketRecordPayload,
} from '@irene/websocket/events';

import { publishWebsocketRecord, raiseWebsocketSignal } from '@irene/websocket/signals';

import type {
  WebsocketMessage,
  WebsocketNoticeHandlers,
  WebsocketRecord,
  WebsocketRecordCache,
} from '@irene/websocket/types';

/** What a dispatch acts through. */
export interface WebsocketDispatchOptions {
  cache: WebsocketRecordCache;
  noticeHandlers: WebsocketNoticeHandlers;
}

/** A handler for every event, and a way to stop what is still pending. */
export interface WebsocketDispatch {
  handlers: Record<string, (payload: unknown) => void>;
  stop: () => void;
}

/**
 * The kind of record an `object` event names, by the type string it sends.
 *
 * Each model writes its own type in `to_dict`, by hand and inconsistently —
 * plural for some, singular for others — so the pairs are listed rather than
 * derived. An unlisted type is ignored: there is nothing to look up.
 */
const _RECORD_TYPE_BY_OBJECT_TYPE: Partial<Record<string, ApiRecordType>> = {
  files: 'file',
  analyses: 'analysis',
  submissions: 'submission',
  dynamicscan: 'dynamicscan',
};

/** How long ids are collected before the queries holding them are read again. */
const _OBJECT_DEBOUNCE_MS = 300;

/** Which level shows a message, by the number the server sends. */
const LEVEL_BY_NOTIFY_TYPE: Record<WebsocketNotifyType, WebsocketMessage['level']> = {
  [WEBSOCKET_NOTIFY_TYPE.info]: 'info',
  [WEBSOCKET_NOTIFY_TYPE.success]: 'success',
  [WEBSOCKET_NOTIFY_TYPE.warning]: 'warning',

  /* There is no alert level of its own, and a warning is what it reads as. */
  [WEBSOCKET_NOTIFY_TYPE.alert]: 'warning',
  [WEBSOCKET_NOTIFY_TYPE.error]: 'error',
};

/**
 * Wraps a handler so it runs only on a payload carrying the keys it reads.
 *
 * A server of a different version sends what it sends, so each handler states
 * what it needs once and is written as though the payload were sound.
 *
 * @param keys - The keys the handler reads.
 * @param handle - What to do with a payload that carries them.
 * @returns A handler for whatever arrives.
 */
function _onPayloadWith<TPayload extends object>(
  keys: (keyof TPayload)[],
  handle: (payload: TPayload) => void
) {
  return (payload: unknown) => {
    if (hasWebsocketKeys<TPayload>(payload, keys)) {
      handle(payload);
    }
  };
}

/**
 * Wraps a handler so it runs only on a record of a kind this client knows.
 *
 * Both record events carry the same payload, so the two checks — the keys, and
 * the kind — are made once here.
 *
 * @param handle - What to do with the record.
 * @returns A handler for whatever arrives.
 */
function _onRecordPayload(handle: (type: ApiRecordType, record: ApiRecordFields) => void) {
  return _onPayloadWith<WebsocketRecordPayload>(
    ['model_name', 'data'],
    ({ model_name: type, data }) => {
      if (isApiRecordType(type)) {
        handle(type, data);
      }
    }
  );
}

/*
  The handlers below depend on nothing, so they are built once. The ones inside
  `createWebsocketDispatch` are the ones that need what an app supplied.
*/

/** A count changed, and whoever counts it reads it again. */
const _handleCounter = _onPayloadWith<WebsocketCounterPayload>(['type'], ({ type }) => {
  if (isWebsocketCounter(type)) {
    raiseWebsocketSignal(`${type}Counter`);
  }
});

/** A record nobody has read is held nowhere, so this is raised rather than written. */
const _handleRecordCreated = _onRecordPayload((type, record) => {
  raiseWebsocketSignal(type);
  publishWebsocketRecord(type, record);
});

/**
 * Gathers the records a run of events names, and reports them once it stops.
 *
 * A scan finishing names the same record several times over, so each id is
 * reported once, after the last of them.
 *
 * @param reportChanged - Called with each record named, once the events have stopped.
 * @param delayMs - How long a name waits for the next before the run counts as over.
 * @returns `add` to name a record, `cancel` to drop what has not been reported.
 */
function _collectChangedRecords(
  onReportChanged: (type: ApiRecordType, id: string | number) => void,
  delayMs: number
) {
  let changed = new Map<string, { type: ApiRecordType; id: string | number }>();
  let timer: ReturnType<typeof setTimeout> | undefined;

  // Process the collected records and reset the map.
  // In this case we're invalidating all tagged cached records matching the ids.
  const invalidateTaggedRecords = () => {
    const collected = changed;
    changed = new Map();
    collected.forEach(({ type, id }) => onReportChanged(type, id));
  };

  return {
    add(type: ApiRecordType, id: string | number) {
      changed.set(getRecordCacheKey(type, id), { type, id });

      clearTimeout(timer);
      timer = setTimeout(invalidateTaggedRecords, delayMs);
    },

    cancel() {
      clearTimeout(timer);
      changed = new Map();
    },
  };
}

/**
 * Builds what the connection does with each event.
 *
 * Three things can happen: a record the client holds is written to the cache, a
 * record named but not sent is read again from the queries holding it, and
 * anything else is raised as a signal. Nothing here reaches a socket, a query
 * or a screen — the cache answers the first two, a subscriber the third, and
 * the app's notice handlers show what the server wrote for a person to read.
 *
 * @param options.cache - Where a record goes, and how the queries holding one are found.
 * @param options.noticeHandlers - What this app does with a message and an unread count.
 * @returns The handlers to register, and a `stop` for the connection's cleanup.
 */
export function createWebsocketDispatch({
  cache,
  noticeHandlers,
}: WebsocketDispatchOptions): WebsocketDispatch {
  const changedRecords = _collectChangedRecords(cache.readQueriesHolding, _OBJECT_DEBOUNCE_MS);

  /** Hands over the count the server just took, rather than reading it again. */
  const handleUnreadCount = _onPayloadWith<WebsocketNotificationPayload>(
    ['unread_count', 'product'],
    ({ unread_count: count, product }) => noticeHandlers.onUnreadCount({ count, product })
  );

  /** Hands the server's words to the app, at the level it asked for. */
  const handleMessage = _onPayloadWith<WebsocketMessagePayload>(
    ['message', 'notifyType'],
    ({ message, notifyType }) =>
      noticeHandlers.onMessage({
        message,
        level: LEVEL_BY_NOTIFY_TYPE[notifyType] ?? 'info',
        /* An error stays until it is dismissed; the rest clear themselves. */
        isPersistent: notifyType === WEBSOCKET_NOTIFY_TYPE.error,
      })
  );

  /** A record named but not sent, so the queries holding it read it again. */
  const handleRecordNamed = _onPayloadWith<WebsocketObjectPayload>(
    ['id', 'type'],
    ({ id, type }) => {
      const recordType = _RECORD_TYPE_BY_OBJECT_TYPE[type];

      if (recordType) {
        changedRecords.add(recordType, id);
      }
    }
  );

  /** A record already on screen is written where it sits, in every query holding it. */
  const handleRecordUpdated = _onRecordPayload((type, record) => {
    if (hasWebsocketKeys<WebsocketRecord>(record, ['id'])) {
      cache.write(type, record);
    }

    publishWebsocketRecord(type, record);
  });

  return {
    handlers: {
      [WEBSOCKET_EVENTS.notification]: handleUnreadCount,
      [WEBSOCKET_EVENTS.message]: handleMessage,
      [WEBSOCKET_EVENTS.counter]: _handleCounter,
      [WEBSOCKET_EVENTS.object]: handleRecordNamed,
      [WEBSOCKET_EVENTS.newObject]: handleRecordNamed,
      [WEBSOCKET_EVENTS.modelCreated]: _handleRecordCreated,
      [WEBSOCKET_EVENTS.modelUpdated]: handleRecordUpdated,
    },

    /* Drops the ids that had not been read again when the session ended. */
    stop: changedRecords.cancel,
  };
}
