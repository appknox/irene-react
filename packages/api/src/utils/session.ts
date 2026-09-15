import type { SessionResponse } from '@irene/api/types/session';

/** Mirrors Ember Simple Auth's `ember_simple_auth-session`. */
export interface Session {
  token: string;
  userId: number;
  b64token: string;
}

export const SESSION_STORAGE_KEY = 'appknox-session';

/**
 * Checks that a parsed value has the shape of a stored session.
 *
 * @param value - Anything read back from storage.
 * @returns Whether the value is a usable session.
 */
const _isValidSession = (value: unknown): value is Session =>
  typeof value === 'object' &&
  value !== null &&
  'token' in value &&
  'userId' in value &&
  'b64token' in value &&
  typeof value.token === 'string' &&
  typeof value.userId === 'number' &&
  typeof value.b64token === 'string';

/**
 * Reads the raw stored session.
 *
 * @returns The stored text, or null when nothing is stored or the browser blocks storage.
 */
const _readStoredSessionText = (): string | null => {
  try {
    return window.localStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
};

/**
 * Parses JSON without throwing.
 *
 * @param text - The text to parse.
 * @returns The parsed value, or null when the text is not valid JSON.
 */
const _parseJsonSafely = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

/**
 * Base64-encodes a string that may contain characters above latin1, which `btoa` rejects.
 *
 * @param value - The string to encode.
 * @returns The base64 encoding of the string's UTF-8 bytes.
 */
export const encodeBase64Utf8 = (value: string): string =>
  btoa(String.fromCodePoint(...new TextEncoder().encode(value)));

/**
 * Builds the credential the API expects in a Basic Authorization header.
 *
 * @param userId - The signed-in user's id.
 * @param token - The user's API token.
 * @returns The base64-encoded `userId:token` pair.
 */
export const buildBasicCredential = (userId: number, token: string): string =>
  encodeBase64Utf8(`${userId}:${token}`);

/**
 * Turns a login or check response into the session that gets stored.
 *
 * @param response - The body returned by the login or check endpoint.
 * @returns The session, with its credential pre-built.
 */
export const createSessionFromResponse = ({
  token,
  user_id: userId,
}: SessionResponse): Session => ({
  token,
  userId,
  b64token: buildBasicCredential(userId, token),
});

/**
 * Reads the stored session. Blocked storage or a bad entry reads as signed out.
 *
 * @returns The session, or null when signed out.
 */
export function getStoredSession(): Session | null {
  const stored = _readStoredSessionText();
  const parsed = stored ? _parseJsonSafely(stored) : null;

  return _isValidSession(parsed) ? parsed : null;
}

/**
 * Persists a session. Throws on storage failure — a login that silently vanishes is worse.
 *
 * @param session - The session to store.
 */
export function storeSession(session: Session): void {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

/** Forgets the stored session. Safe to call when nothing is stored. */
export function clearStoredSession(): void {
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Nothing stored means nothing to clear.
  }
}

/**
 * Checks whether a session is stored.
 *
 * @returns Whether the user is signed in.
 */
export const isSignedIn = (): boolean => getStoredSession() !== null;

/**
 * Reads the signed-in user's id.
 *
 * @returns The user id, or undefined when signed out.
 */
export const getSignedInUserId = (): number | undefined => getStoredSession()?.userId;

/**
 * Builds the Authorization header for the stored session.
 *
 * @returns `Basic <b64token>`, or undefined when signed out so no request carries an empty header.
 */
export const getAuthorizationHeader = (): string | undefined => {
  const b64token = getStoredSession()?.b64token;

  return b64token ? `Basic ${b64token}` : undefined;
};
