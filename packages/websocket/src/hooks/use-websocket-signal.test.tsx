import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { clearWebsocketSignals, raiseWebsocketSignal } from '@irene/websocket/signals';

import { useWebsocketSignal } from './use-websocket-signal';

afterEach(() => {
  clearWebsocketSignals();
});

describe('useWebsocketSignal', () => {
  it('runs when the subject it named is raised', () => {
    const onSignal = vi.fn();

    renderHook(() => useWebsocketSignal('FileCounter', onSignal));

    raiseWebsocketSignal('FileCounter');

    expect(onSignal).toHaveBeenCalledOnce();
  });

  it('does not run for another subject', () => {
    const onSignal = vi.fn();

    renderHook(() => useWebsocketSignal('FileCounter', onSignal));

    raiseWebsocketSignal('ProjectCounter');

    expect(onSignal).not.toHaveBeenCalled();
  });

  it('stops listening once the screen is gone', () => {
    const onSignal = vi.fn();

    const { unmount } = renderHook(() => useWebsocketSignal('FileCounter', onSignal));

    unmount();
    raiseWebsocketSignal('FileCounter');

    expect(onSignal).not.toHaveBeenCalled();
  });

  it('listens for the new subject when the screen changes which it cares about', () => {
    const onSignal = vi.fn();

    const { rerender } = renderHook(({ signal }) => useWebsocketSignal(signal, onSignal), {
      initialProps: { signal: 'FileCounter' as const },
    });

    rerender({ signal: 'ProjectCounter' as unknown as 'FileCounter' });
    raiseWebsocketSignal('ProjectCounter');

    expect(onSignal).toHaveBeenCalledOnce();
  });
});
