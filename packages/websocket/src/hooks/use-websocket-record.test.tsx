import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { clearWebsocketSignals, publishWebsocketRecord } from '@irene/websocket/signals';

import { useWebsocketRecord } from './use-websocket-record';

afterEach(() => {
  clearWebsocketSignals();
});

describe('useWebsocketRecord', () => {
  it('runs with each record of the kind it named', () => {
    const onRecord = vi.fn();

    renderHook(() => useWebsocketRecord('file', onRecord));

    publishWebsocketRecord('file', { id: 1, name: 'a file' });

    expect(onRecord).toHaveBeenCalledWith({ id: 1, name: 'a file' });
  });

  it('does not run for another kind of record', () => {
    const onRecord = vi.fn();

    renderHook(() => useWebsocketRecord('file', onRecord));

    publishWebsocketRecord('analysis', { id: 1 });

    expect(onRecord).not.toHaveBeenCalled();
  });

  it('stops listening once the screen is gone', () => {
    const onRecord = vi.fn();

    const { unmount } = renderHook(() => useWebsocketRecord('file', onRecord));

    unmount();
    publishWebsocketRecord('file', { id: 1 });

    expect(onRecord).not.toHaveBeenCalled();
  });
});
