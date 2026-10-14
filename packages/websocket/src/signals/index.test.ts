import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearWebsocketSignals,
  publishWebsocketRecord,
  raiseWebsocketSignal,
  subscribeToWebsocketRecords,
  subscribeToWebsocketSignal,
} from './index';

afterEach(() => {
  clearWebsocketSignals();
});

describe('a signal', () => {
  it('reaches a listener for that subject', () => {
    const onSignal = vi.fn();

    subscribeToWebsocketSignal('FileCounter', onSignal);
    raiseWebsocketSignal('FileCounter');

    expect(onSignal).toHaveBeenCalledOnce();
  });

  it('reaches every listener for that subject', () => {
    const first = vi.fn();
    const second = vi.fn();

    subscribeToWebsocketSignal('FileCounter', first);
    subscribeToWebsocketSignal('FileCounter', second);
    raiseWebsocketSignal('FileCounter');

    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it('reaches nobody listening for another subject', () => {
    const onSignal = vi.fn();

    subscribeToWebsocketSignal('ProjectCounter', onSignal);
    raiseWebsocketSignal('FileCounter');

    expect(onSignal).not.toHaveBeenCalled();
  });

  it('reaches a listener again each time it is raised', () => {
    const onSignal = vi.fn();

    subscribeToWebsocketSignal('FileCounter', onSignal);
    raiseWebsocketSignal('FileCounter');
    raiseWebsocketSignal('FileCounter');

    expect(onSignal).toHaveBeenCalledTimes(2);
  });

  it('reaches nobody once they have stopped listening', () => {
    const onSignal = vi.fn();

    const stop = subscribeToWebsocketSignal('FileCounter', onSignal);

    stop();
    raiseWebsocketSignal('FileCounter');

    expect(onSignal).not.toHaveBeenCalled();
  });

  it('leaves the other listeners alone when one stops', () => {
    const staying = vi.fn();
    const leaving = vi.fn();

    subscribeToWebsocketSignal('FileCounter', staying);
    subscribeToWebsocketSignal('FileCounter', leaving)();

    raiseWebsocketSignal('FileCounter');

    expect(staying).toHaveBeenCalledOnce();
    expect(leaving).not.toHaveBeenCalled();
  });

  it('is raised quietly when nothing is listening', () => {
    expect(() => raiseWebsocketSignal('FileCounter')).not.toThrow();
  });

  it('reaches a listener that stops itself, without skipping the next one', () => {
    const second = vi.fn();

    const stopFirst = subscribeToWebsocketSignal('FileCounter', () => stopFirst());
    subscribeToWebsocketSignal('FileCounter', second);

    raiseWebsocketSignal('FileCounter');

    expect(second).toHaveBeenCalledOnce();
  });

  it('stops quietly when the same listener is dropped twice', () => {
    const stop = subscribeToWebsocketSignal('FileCounter', vi.fn());

    stop();

    expect(() => stop()).not.toThrow();
  });
});

describe('a record published to listeners', () => {
  it('reaches a listener for that kind, with the record', () => {
    const onRecord = vi.fn();

    subscribeToWebsocketRecords('file', onRecord);
    publishWebsocketRecord('file', { id: 1, name: 'a file' });

    expect(onRecord).toHaveBeenCalledWith({ id: 1, name: 'a file' });
  });

  it('reaches nobody listening for another kind', () => {
    const onRecord = vi.fn();

    subscribeToWebsocketRecords('analysis', onRecord);
    publishWebsocketRecord('file', { id: 1 });

    expect(onRecord).not.toHaveBeenCalled();
  });

  it('reaches nobody once they have stopped listening', () => {
    const onRecord = vi.fn();

    subscribeToWebsocketRecords('file', onRecord)();
    publishWebsocketRecord('file', { id: 1 });

    expect(onRecord).not.toHaveBeenCalled();
  });

  it('is published quietly when nothing is listening', () => {
    expect(() => publishWebsocketRecord('file', { id: 1 })).not.toThrow();
  });

  it('leaves the other listeners alone when one stops', () => {
    const staying = vi.fn();

    subscribeToWebsocketRecords('file', staying);
    subscribeToWebsocketRecords('file', vi.fn())();

    publishWebsocketRecord('file', { id: 1 });

    expect(staying).toHaveBeenCalledOnce();
  });
});

describe('clearWebsocketSignals', () => {
  it('drops the listeners for both subjects and records', () => {
    const onSignal = vi.fn();
    const onRecord = vi.fn();

    subscribeToWebsocketSignal('FileCounter', onSignal);
    subscribeToWebsocketRecords('file', onRecord);

    clearWebsocketSignals();

    raiseWebsocketSignal('FileCounter');
    publishWebsocketRecord('file', { id: 1 });

    expect(onSignal).not.toHaveBeenCalled();
    expect(onRecord).not.toHaveBeenCalled();
  });
});
