import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import type { ApiRecordType } from '@irene/api/normalization';

import {
  WEBSOCKET_EVENTS,
  WEBSOCKET_NOTIFY_TYPE,
  WEBSOCKET_PRODUCTS,
} from '@irene/websocket/events';

import {
  clearWebsocketSignals,
  subscribeToWebsocketRecords,
  subscribeToWebsocketSignal,
} from '@irene/websocket/signals';

import type {
  WebsocketMessage,
  WebsocketRecord,
  WebsocketUnreadCount,
} from '@irene/websocket/types';

import { createWebsocketDispatch, type WebsocketDispatchOptions } from './dispatch';

let cache: {
  write: Mock<(type: ApiRecordType, record: WebsocketRecord) => void>;
  readQueriesHolding: Mock<(type: ApiRecordType, id: string | number) => void>;
};

let noticeHandlers: {
  onMessage: Mock<(message: WebsocketMessage) => void>;
  onUnreadCount: Mock<(unread: WebsocketUnreadCount) => void>;
};

let handlers: ReturnType<typeof createWebsocketDispatch>['handlers'];
let stop: () => void;

beforeEach(() => {
  cache = { write: vi.fn(), readQueriesHolding: vi.fn() };
  noticeHandlers = { onMessage: vi.fn(), onUnreadCount: vi.fn() };

  ({ handlers, stop } = createWebsocketDispatch({
    cache,
    noticeHandlers,
  } satisfies WebsocketDispatchOptions));
});

afterEach(() => {
  stop();
  clearWebsocketSignals();
  vi.useRealTimers();
});

describe('the handlers', () => {
  it('cover every event the server sends, and nothing else', () => {
    expect(Object.keys(handlers)).toEqual([
      WEBSOCKET_EVENTS.notification,
      WEBSOCKET_EVENTS.message,
      WEBSOCKET_EVENTS.counter,
      WEBSOCKET_EVENTS.object,
      WEBSOCKET_EVENTS.newObject,
      WEBSOCKET_EVENTS.modelCreated,
      WEBSOCKET_EVENTS.modelUpdated,
    ]);
  });
});

describe('the unread count', () => {
  it('is handed over with the product it belongs to', () => {
    handlers[WEBSOCKET_EVENTS.notification]({
      unread_count: 9,
      product: WEBSOCKET_PRODUCTS.appknox,
    });

    expect(noticeHandlers.onUnreadCount).toHaveBeenCalledWith({
      count: 9,
      product: WEBSOCKET_PRODUCTS.appknox,
    });
  });

  it('is handed over for every product, since which one matters is the app-s own', () => {
    handlers[WEBSOCKET_EVENTS.notification]({
      unread_count: 9,
      product: WEBSOCKET_PRODUCTS.storeknox,
    });

    expect(noticeHandlers.onUnreadCount).toHaveBeenCalledWith({
      count: 9,
      product: WEBSOCKET_PRODUCTS.storeknox,
    });
  });

  it.each([
    ['no count', { product: WEBSOCKET_PRODUCTS.appknox }],
    ['no product', { unread_count: 9 }],
    ['nothing at all', undefined],
  ])('is ignored when the server sends %s', (_label, payload) => {
    handlers[WEBSOCKET_EVENTS.notification](payload);

    expect(noticeHandlers.onUnreadCount).not.toHaveBeenCalled();
  });
});

describe('a message', () => {
  it.each([
    [WEBSOCKET_NOTIFY_TYPE.info, 'info'],
    [WEBSOCKET_NOTIFY_TYPE.success, 'success'],
    [WEBSOCKET_NOTIFY_TYPE.warning, 'warning'],
    /* There is no alert level of its own, and a warning is what it reads as. */
    [WEBSOCKET_NOTIFY_TYPE.alert, 'warning'],
    [WEBSOCKET_NOTIFY_TYPE.error, 'error'],
  ])('is shown at the level the server asked for (%s)', (notifyType, level) => {
    handlers[WEBSOCKET_EVENTS.message]({ message: 'A scan finished', notifyType });

    expect(noticeHandlers.onMessage).toHaveBeenCalledWith(expect.objectContaining({ level }));
  });

  it('carries the server-s own words', () => {
    handlers[WEBSOCKET_EVENTS.message]({
      message: 'A scan finished',
      notifyType: WEBSOCKET_NOTIFY_TYPE.info,
    });

    expect(noticeHandlers.onMessage).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'A scan finished' })
    );
  });

  it('asks for an error to stay until it is dismissed', () => {
    handlers[WEBSOCKET_EVENTS.message]({
      message: 'It failed',
      notifyType: WEBSOCKET_NOTIFY_TYPE.error,
    });

    expect(noticeHandlers.onMessage).toHaveBeenCalledWith(
      expect.objectContaining({ isPersistent: true })
    );
  });

  it('lets anything else clear itself', () => {
    handlers[WEBSOCKET_EVENTS.message]({
      message: 'Done',
      notifyType: WEBSOCKET_NOTIFY_TYPE.success,
    });

    expect(noticeHandlers.onMessage).toHaveBeenCalledWith(
      expect.objectContaining({ isPersistent: false })
    );
  });

  it('reads a level it does not know as information', () => {
    handlers[WEBSOCKET_EVENTS.message]({ message: 'Something', notifyType: 99 });

    expect(noticeHandlers.onMessage).toHaveBeenCalledWith(
      expect.objectContaining({ level: 'info' })
    );
  });

  it.each([
    ['no message', { notifyType: WEBSOCKET_NOTIFY_TYPE.info }],
    ['no level', { message: 'Done' }],
    ['nothing at all', undefined],
  ])('is ignored when the server sends %s', (_label, payload) => {
    handlers[WEBSOCKET_EVENTS.message](payload);

    expect(noticeHandlers.onMessage).not.toHaveBeenCalled();
  });
});

describe('a count the server keeps', () => {
  it('is raised as a signal, for whoever counts it to read again', () => {
    const onSignal = vi.fn();

    subscribeToWebsocketSignal('FileCounter', onSignal);

    handlers[WEBSOCKET_EVENTS.counter]({ type: 'File' });

    expect(onSignal).toHaveBeenCalledOnce();
  });

  it('raises nothing for a count this client does not know', () => {
    const onSignal = vi.fn();

    subscribeToWebsocketSignal('FileCounter', onSignal);

    handlers[WEBSOCKET_EVENTS.counter]({ type: 'Teapot' });

    expect(onSignal).not.toHaveBeenCalled();
  });

  it.each([
    ['no type', {}],
    ['nothing at all', undefined],
  ])('is ignored when the server sends %s', (_label, payload) => {
    expect(() => handlers[WEBSOCKET_EVENTS.counter](payload)).not.toThrow();
  });
});

describe('a record the server sent in full', () => {
  it('is written to the cache under its own kind', () => {
    handlers[WEBSOCKET_EVENTS.modelUpdated]({ model_name: 'file', data: { id: 1, name: 'after' } });

    expect(cache.write).toHaveBeenCalledWith('file', { id: 1, name: 'after' });
  });

  it('is handed to whoever is listening for that kind', () => {
    const onRecord = vi.fn();

    subscribeToWebsocketRecords('file', onRecord);

    handlers[WEBSOCKET_EVENTS.modelUpdated]({ model_name: 'file', data: { id: 1, name: 'after' } });

    expect(onRecord).toHaveBeenCalledWith({ id: 1, name: 'after' });
  });

  it('is not written without an id, which no query could hold it by', () => {
    handlers[WEBSOCKET_EVENTS.modelUpdated]({ model_name: 'file', data: { name: 'after' } });

    expect(cache.write).not.toHaveBeenCalled();
  });

  it('is still handed over without an id, for a screen that can use it', () => {
    const onRecord = vi.fn();

    subscribeToWebsocketRecords('file', onRecord);

    handlers[WEBSOCKET_EVENTS.modelUpdated]({ model_name: 'file', data: { name: 'after' } });

    expect(onRecord).toHaveBeenCalledWith({ name: 'after' });
  });

  it.each([
    ['no kind', { data: { id: 1 } }],
    ['no record', { model_name: 'file' }],
    ['a kind this client does not know', { model_name: 'teapot', data: { id: 1 } }],
    ['nothing at all', undefined],
  ])('is ignored when the server sends %s', (_label, payload) => {
    handlers[WEBSOCKET_EVENTS.modelUpdated](payload);

    expect(cache.write).not.toHaveBeenCalled();
  });
});

describe('a record the server says it created', () => {
  it('is raised as a signal, since no query holds a record nobody has read', () => {
    const onSignal = vi.fn();

    subscribeToWebsocketSignal('file', onSignal);

    handlers[WEBSOCKET_EVENTS.modelCreated]({ model_name: 'file', data: { id: 1 } });

    expect(onSignal).toHaveBeenCalledOnce();
  });

  it('is not written, since writing reaches only queries that already hold it', () => {
    handlers[WEBSOCKET_EVENTS.modelCreated]({ model_name: 'file', data: { id: 1 } });

    expect(cache.write).not.toHaveBeenCalled();
  });

  it('is handed to whoever is listening for that kind', () => {
    const onRecord = vi.fn();

    subscribeToWebsocketRecords('file', onRecord);

    handlers[WEBSOCKET_EVENTS.modelCreated]({ model_name: 'file', data: { id: 1, name: 'new' } });

    expect(onRecord).toHaveBeenCalledWith({ id: 1, name: 'new' });
  });

  it('is ignored when the server names no kind', () => {
    const onSignal = vi.fn();

    subscribeToWebsocketSignal('file', onSignal);

    handlers[WEBSOCKET_EVENTS.modelCreated]({ data: { id: 1 } });

    expect(onSignal).not.toHaveBeenCalled();
  });
});

/** How long the dispatch collects named records before reading the queries holding them. */
const DEBOUNCE_MS = 300;

describe('a record the server named rather than sent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('is read again from the queries holding it, once the burst stops', () => {
    handlers[WEBSOCKET_EVENTS.object]({ id: 1, type: 'files' });

    expect(cache.readQueriesHolding).not.toHaveBeenCalled();

    vi.advanceTimersByTime(DEBOUNCE_MS);

    expect(cache.readQueriesHolding).toHaveBeenCalledWith('file', 1);
  });

  it('is read the same way under the older event name', () => {
    handlers[WEBSOCKET_EVENTS.newObject]({ id: 1, type: 'files' });
    vi.advanceTimersByTime(DEBOUNCE_MS);

    expect(cache.readQueriesHolding).toHaveBeenCalledWith('file', 1);
  });

  it('is read once for a record named several times in one burst', () => {
    handlers[WEBSOCKET_EVENTS.object]({ id: 1, type: 'files' });
    handlers[WEBSOCKET_EVENTS.object]({ id: 1, type: 'files' });
    vi.advanceTimersByTime(DEBOUNCE_MS);

    expect(cache.readQueriesHolding).toHaveBeenCalledOnce();
  });

  it('reads nothing for a type the server has not been seen to send', () => {
    handlers[WEBSOCKET_EVENTS.object]({ id: 1, type: 'teapots' });
    vi.advanceTimersByTime(DEBOUNCE_MS);

    expect(cache.readQueriesHolding).not.toHaveBeenCalled();
  });

  it.each([
    ['no id', { type: 'files' }],
    ['no type', { id: 1 }],
    ['nothing at all', undefined],
  ])('is ignored when the server sends %s', (_label, payload) => {
    handlers[WEBSOCKET_EVENTS.object](payload);
    vi.advanceTimersByTime(DEBOUNCE_MS);

    expect(cache.readQueriesHolding).not.toHaveBeenCalled();
  });

  it('is dropped when the session ends before the burst is read', () => {
    handlers[WEBSOCKET_EVENTS.object]({ id: 1, type: 'files' });
    stop();

    vi.advanceTimersByTime(DEBOUNCE_MS);

    expect(cache.readQueriesHolding).not.toHaveBeenCalled();
  });

  it('is read for every record the burst named', () => {
    handlers[WEBSOCKET_EVENTS.object]({ id: 1, type: 'files' });
    handlers[WEBSOCKET_EVENTS.object]({ id: 2, type: 'files' });
    handlers[WEBSOCKET_EVENTS.object]({ id: 1, type: 'analyses' });

    vi.advanceTimersByTime(DEBOUNCE_MS);

    expect(cache.readQueriesHolding).toHaveBeenCalledTimes(3);
  });

  it('tells one kind of record from another with the same id', () => {
    handlers[WEBSOCKET_EVENTS.object]({ id: 1, type: 'files' });
    handlers[WEBSOCKET_EVENTS.object]({ id: 1, type: 'analyses' });

    vi.advanceTimersByTime(DEBOUNCE_MS);

    expect(cache.readQueriesHolding).toHaveBeenCalledWith('file', 1);
    expect(cache.readQueriesHolding).toHaveBeenCalledWith('analysis', 1);
  });

  it('waits again when another record is named before the burst stops', () => {
    handlers[WEBSOCKET_EVENTS.object]({ id: 1, type: 'files' });

    vi.advanceTimersByTime(DEBOUNCE_MS - 1);
    handlers[WEBSOCKET_EVENTS.object]({ id: 2, type: 'files' });
    vi.advanceTimersByTime(DEBOUNCE_MS - 1);

    expect(cache.readQueriesHolding).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(cache.readQueriesHolding).toHaveBeenCalledTimes(2);
  });

  it('starts a new burst after one is read', () => {
    handlers[WEBSOCKET_EVENTS.object]({ id: 1, type: 'files' });
    vi.advanceTimersByTime(DEBOUNCE_MS);

    handlers[WEBSOCKET_EVENTS.object]({ id: 1, type: 'files' });
    vi.advanceTimersByTime(DEBOUNCE_MS);

    expect(cache.readQueriesHolding).toHaveBeenCalledTimes(2);
  });

  it('forgets what the ended session collected, so the next burst stands alone', () => {
    handlers[WEBSOCKET_EVENTS.object]({ id: 1, type: 'files' });
    stop();

    handlers[WEBSOCKET_EVENTS.object]({ id: 2, type: 'files' });
    vi.advanceTimersByTime(DEBOUNCE_MS);

    expect(cache.readQueriesHolding).toHaveBeenCalledExactlyOnceWith('file', 2);
  });

  it('ends a session quietly when no record is waiting to be read', () => {
    expect(() => stop()).not.toThrow();
  });
});
