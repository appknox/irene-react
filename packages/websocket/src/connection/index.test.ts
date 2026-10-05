import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { configurationStore } from '@irene/api/stores/configuration';

import {
  closeWebsocketConnection,
  getWebsocketConnection,
  openWebsocketConnection,
  setWebsocketTransport,
  socketIoTransport,
  websocketTransport,
} from './index';

const socket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  removeAllListeners: vi.fn(),
};

const io = vi.hoisted(() => vi.fn());

vi.mock('socket.io-client', () => ({ io }));

/** Runs whatever the connection registered for an event, as the server would. */
const fire = (event: string, payload?: unknown) => {
  socket.on.mock.calls
    .filter(([name]) => name === event)
    .forEach(([, handler]) => handler(payload));
};

describe('the websocket connection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    io.mockReturnValue(socket);
  });

  afterEach(() => {
    closeWebsocketConnection();
  });

  it('opens against the host the deployment reports, where the server mounts', () => {
    configurationStore.getState().setServerConfiguration({
      websocket: 'https://sockets.appknox.com',
      devicefarm_url: '',
      enterprise: false,
    });

    openWebsocketConnection('a-room');

    expect(io).toHaveBeenCalledWith(
      'https://sockets.appknox.com',
      expect.objectContaining({ path: '/websocket' })
    );
  });

  it('joins the account room once connected', () => {
    openWebsocketConnection('a-room');

    fire('connect');

    expect(socket.emit).toHaveBeenCalledWith('subscribe', { room: 'a-room' });
  });

  it('rejoins the room on every connect, so a reconnection does not land outside it', () => {
    openWebsocketConnection('a-room');

    fire('connect');
    fire('connect');

    expect(socket.emit).toHaveBeenCalledTimes(2);
  });

  it('hands back the connection already open rather than opening a second', () => {
    const first = openWebsocketConnection('a-room');
    const second = openWebsocketConnection('a-room');

    expect(second).toBe(first);
    expect(io).toHaveBeenCalledTimes(1);
  });

  it('reports the connection while one is open', () => {
    expect(getWebsocketConnection()).toBeNull();

    openWebsocketConnection('a-room');

    expect(getWebsocketConnection()).toBe(socket);
  });

  it('drops its listeners and disconnects when closed', () => {
    openWebsocketConnection('a-room');

    closeWebsocketConnection();

    expect(socket.removeAllListeners).toHaveBeenCalled();
    expect(socket.disconnect).toHaveBeenCalled();
    expect(getWebsocketConnection()).toBeNull();
  });

  it('opens a new connection after a close, so the next account gets its own room', () => {
    openWebsocketConnection('a-room');
    closeWebsocketConnection();
    openWebsocketConnection('another-room');

    fire('connect');

    expect(io).toHaveBeenCalledTimes(2);
    expect(socket.emit).toHaveBeenLastCalledWith('subscribe', { room: 'another-room' });
  });

  it('closes quietly when nothing is open', () => {
    expect(() => closeWebsocketConnection()).not.toThrow();
  });
});

describe('the Socket.IO transport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    io.mockReturnValue(socket);
  });

  afterEach(() => {
    closeWebsocketConnection();
  });

  it('opens the room it is given', () => {
    socketIoTransport.open('a-room');

    fire('connect');

    expect(socket.emit).toHaveBeenCalledWith('subscribe', { room: 'a-room' });
  });

  it('registers a handler on the connection', () => {
    const handler = vi.fn();

    socketIoTransport.open('a-room').on('message', handler);

    expect(socket.on).toHaveBeenCalledWith('message', handler);
  });

  it('drops a handler from the connection', () => {
    const handler = vi.fn();

    socketIoTransport.open('a-room').off('message', handler);

    expect(socket.off).toHaveBeenCalledWith('message', handler);
  });

  it('closes the connection, so the next account gets its own', () => {
    socketIoTransport.open('a-room').close();

    expect(socket.disconnect).toHaveBeenCalled();
    expect(getWebsocketConnection()).toBeNull();
  });
});

describe('the transport connections open through', () => {
  afterEach(() => {
    setWebsocketTransport();
  });

  it('is Socket.IO until something replaces it', () => {
    expect(websocketTransport()).toBe(socketIoTransport);
  });

  it('is whatever was installed, so a test reaches no network', () => {
    const fake = { open: vi.fn() };

    setWebsocketTransport(fake);

    expect(websocketTransport()).toBe(fake);
  });

  it('goes back to Socket.IO when the installed one is taken away', () => {
    setWebsocketTransport({ open: vi.fn() });
    setWebsocketTransport();

    expect(websocketTransport()).toBe(socketIoTransport);
  });
});
