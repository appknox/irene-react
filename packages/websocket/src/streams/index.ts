import { configurationStore } from '@irene/api/stores/configuration';

/** How long a device connection is kept with nothing using it. */
export const DEVICE_SESSION_TTL_MS = 10 * 60 * 1000;

const WEBSOCKIFY_PATH = '/websockify';

/**
 * The address of a device's stream, authorized by a token.
 *
 * Not the account's socket: one connection per device session, opened against
 * the device farm and authorized by a token granted for that device.
 *
 * @param token - The token granted for this device session.
 * @returns The `ws://` or `wss://` address to open.
 */
export function deviceStreamUrl(token: string) {
  if (!token) {
    throw new Error('A device stream needs a token');
  }

  const farmUrl = configurationStore.getState().deviceFarmUrl();
  const streamUrl = new URL(`${WEBSOCKIFY_PATH}?token=${encodeURIComponent(token)}`, farmUrl);

  /* The farm reports an http origin, and a stream is the same host over a socket. */
  streamUrl.protocol = streamUrl.protocol.replace('http', 'ws');

  return streamUrl.href;
}

/** A connection to one device, which the holder can close. */
interface DeviceSession {
  close: () => Promise<void> | void;
}

const held = new Map<string, { session: DeviceSession; expiry: ReturnType<typeof setTimeout> }>();

async function close(serial: string) {
  const entry = held.get(serial);

  if (!entry) {
    return;
  }

  clearTimeout(entry.expiry);
  await entry.session.close();

  /* A replacement may have been stored while this close ran, so only drop what it closed. */
  if (held.get(serial) === entry) {
    held.delete(serial);
  }
}

const expireAfterTtl = (serial: string) =>
  setTimeout(() => void close(serial), DEVICE_SESSION_TTL_MS);

/**
 * Holds a device's connection so a later screen reuses it rather than reopening.
 *
 * Connecting to a device is slow and the user moves between screens while it
 * runs, so the connection outlives the component that opened it.
 *
 * @param serial - The device the session is for.
 * @param session - The connection, which this registry will close.
 */
export function holdDeviceSession(serial: string, session: DeviceSession) {
  void close(serial);
  held.set(serial, { session, expiry: expireAfterTtl(serial) });
}

/**
 * The connection held for a device, if one is still open.
 *
 * Reading it restarts the countdown, so a session in use is not closed under
 * whoever is using it.
 *
 * @param serial - The device to look for.
 * @returns The open connection, or nothing.
 */
export function heldDeviceSession(serial: string) {
  const entry = held.get(serial);

  if (!entry) {
    return undefined;
  }

  clearTimeout(entry.expiry);
  entry.expiry = expireAfterTtl(serial);

  return entry.session;
}

/**
 * Closes a device's connection now.
 *
 * @param serial - The device to release.
 */
export async function releaseDeviceSession(serial: string) {
  await close(serial);
}

/** Closes every held connection, which is what signing out does. */
export async function releaseAllDeviceSessions() {
  await Promise.all([...held.keys()].map(close));
}
