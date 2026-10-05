import { QueryNormalizerProvider } from '@normy/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { NORMALIZER_CONFIG } from '@irene/api/normalization';

import { WEBSOCKET_EVENTS } from '@irene/websocket/events';
import { clearWebsocketSignals } from '@irene/websocket/signals';
import type { WebsocketNoticeHandlers, WebsocketTransport } from '@irene/websocket/types';

import { useWebsocketConnection } from './use-websocket-connection';

const channel = { on: vi.fn(), off: vi.fn(), close: vi.fn() };
const transport: WebsocketTransport = { open: vi.fn(() => channel) };

const noticeHandlers: WebsocketNoticeHandlers = { onMessage: vi.fn(), onUnreadCount: vi.fn() };

const queryClient = new QueryClient();

/** The providers an app puts above the connection. */
const withProviders = ({ children }: { children: ReactNode }) => (
  <QueryNormalizerProvider queryClient={queryClient} normalizerConfig={NORMALIZER_CONFIG}>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </QueryNormalizerProvider>
);

const renderForRoom = (socketId: string | null) =>
  renderHook(() => useWebsocketConnection({ socketId, noticeHandlers, transport }), {
    wrapper: withProviders,
  });

describe('useWebsocketConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearWebsocketSignals();
  });

  it('opens the room the account names', () => {
    renderForRoom('a-room');

    expect(transport.open).toHaveBeenCalledWith('a-room');
  });

  it('opens nothing for an account the server gave no room', () => {
    renderForRoom(null);

    expect(transport.open).not.toHaveBeenCalled();
  });

  it('listens for every event the server sends', () => {
    renderForRoom('a-room');

    expect(channel.on.mock.calls.map(([event]) => event)).toEqual([
      WEBSOCKET_EVENTS.notification,
      WEBSOCKET_EVENTS.message,
      WEBSOCKET_EVENTS.counter,
      WEBSOCKET_EVENTS.object,
      WEBSOCKET_EVENTS.newObject,
      WEBSOCKET_EVENTS.modelCreated,
      WEBSOCKET_EVENTS.modelUpdated,
    ]);
  });

  it('shows a message the server sends through the app-s noticeHandlers', () => {
    renderForRoom('a-room');

    const [, handleMessage] =
      channel.on.mock.calls.find(([event]) => event === WEBSOCKET_EVENTS.message) ?? [];

    handleMessage?.({ message: 'A scan finished', notifyType: 0 });

    expect(noticeHandlers.onMessage).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'A scan finished' })
    );
  });

  it('drops every handler when the session ends', () => {
    const { unmount } = renderForRoom('a-room');

    unmount();

    expect(channel.off.mock.calls.map(([event]) => event)).toEqual(
      channel.on.mock.calls.map(([event]) => event)
    );
  });

  it('closes the connection when the session ends, so the next account gets its own', () => {
    const { unmount } = renderForRoom('a-room');

    unmount();

    expect(channel.close).toHaveBeenCalled();
  });

  it('closes nothing when it never opened anything', () => {
    const { unmount } = renderForRoom(null);

    unmount();

    expect(channel.close).not.toHaveBeenCalled();
  });

  it('opens one connection across re-renders, rather than reopening on each', () => {
    const { rerender } = renderForRoom('a-room');

    rerender();

    expect(transport.open).toHaveBeenCalledOnce();
  });

  it('opens one connection although the app writes its noticeHandlers inline', () => {
    const { rerender } = renderHook(
      () =>
        useWebsocketConnection({
          socketId: 'a-room',
          noticeHandlers: { onMessage: () => undefined, onUnreadCount: () => undefined },
          transport,
        }),
      { wrapper: withProviders }
    );

    rerender();

    expect(transport.open).toHaveBeenCalledOnce();
  });
});
