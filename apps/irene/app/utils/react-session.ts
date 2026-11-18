/*
  Both apps are served from one origin while the migration runs, and each keeps
  its own session entry under its own key and shape. Neither app can read the
  other's, so each writes the other's whenever the session changes, and a
  sign-in made in either one is a sign-in in both.
*/

/** The key the React app takes its credential from. */
const REACT_AUTH_SESSION_KEY = 'irene:auth-session';

/** The key Ember Simple Auth keeps this app's session under. */
const EMBER_AUTH_SESSION_KEY = 'ember_simple_auth-session';

/** The authenticator a session taken from the React side is restored with. */
const EMBER_AUTHENTICATOR = 'authenticator:login';

export interface ReactSessionData {
  token: string;
  user_id: number;
  b64token?: string;
}

/**
 * Reads a stored entry without throwing on blocked storage or bad JSON.
 *
 * @param key - The key to read.
 * @returns The parsed value, or null when there is nothing usable there.
 */
function readStoredEntry(key: string): unknown {
  try {
    const stored = window.localStorage.getItem(key);

    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Writes the entry the React app reads, or removes it.
 *
 * Its field names differ from this app's, so the values are re-keyed rather
 * than the object being reused.
 *
 * @param data - The session this app just took, or null once it is given up.
 */
export function syncReactSession(data: ReactSessionData | null) {
  try {
    if (!data?.b64token) {
      window.localStorage.removeItem(REACT_AUTH_SESSION_KEY);

      return;
    }

    const entry = JSON.stringify({
      token: data.token,
      userId: data.user_id,
      b64token: data.b64token,
    });

    /* Only on a change, so nothing watching the key sees a write that changed nothing. */
    if (window.localStorage.getItem(REACT_AUTH_SESSION_KEY) !== entry) {
      window.localStorage.setItem(REACT_AUTH_SESSION_KEY, entry);
    }
  } catch {
    /* Nothing to write into, which the React app reads as signed out. */
  }
}

/**
 * Whether this app already holds a session of its own.
 *
 * @returns Whether Ember Simple Auth has a credential stored.
 */
function hasOwnSession(): boolean {
  const own = readStoredEntry(EMBER_AUTH_SESSION_KEY);

  if (typeof own !== 'object' || own === null || !('authenticated' in own)) {
    return false;
  }

  const { authenticated } = own;

  return (
    typeof authenticated === 'object' &&
    authenticated !== null &&
    'b64token' in authenticated &&
    typeof authenticated.b64token === 'string'
  );
}

/**
 * Takes the session the React app signed in with, when this app has none.
 *
 * A migrated sign-in page authenticates on the React side, which writes only
 * its own entry. Without this, the sign-in succeeds and this app still
 * believes nobody is signed in and sends the user back to its login page.
 *
 * Call before `session.setup()`, so the restore reads what this writes.
 */
export function adoptReactSession() {
  if (hasOwnSession()) {
    return;
  }

  const entry = readStoredEntry(REACT_AUTH_SESSION_KEY);

  if (typeof entry !== 'object' || entry === null) {
    return;
  }

  const token = 'token' in entry ? entry.token : undefined;
  const userId = 'userId' in entry ? entry.userId : undefined;
  const b64token = 'b64token' in entry ? entry.b64token : undefined;

  if (
    typeof token !== 'string' ||
    typeof userId !== 'number' ||
    typeof b64token !== 'string'
  ) {
    return;
  }

  try {
    window.localStorage.setItem(
      EMBER_AUTH_SESSION_KEY,
      JSON.stringify({
        authenticated: {
          authenticator: EMBER_AUTHENTICATOR,
          token,
          user_id: userId,
          b64token,
        },
      })
    );
  } catch {
    /* Nothing to write into, which leaves this app signed out. */
  }
}
