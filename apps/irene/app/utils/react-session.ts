/*
  The session entry the embedded React pages read.

  Those pages make their own API calls, and their client takes its credential
  from local storage under a key and a shape of its own. This app is the one
  that signs in, so it writes that entry too.
*/

/** The key the embedded React pages take their credential from. */
const REACT_AUTH_SESSION_KEY = 'irene:auth-session';

interface ReactSessionData {
  token: string;
  user_id: number;
  b64token?: string;
}

/**
 * Writes the entry the embedded React pages read, or removes it.
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
    /* Nothing to write into, which the embedded pages read as signed out. */
  }
}

/** The key Ember Simple Auth keeps this app's session under. */
const EMBER_AUTH_SESSION_KEY = 'ember_simple_auth-session';

/** The authenticator a session taken from the React side is restored with. */
const EMBER_AUTHENTICATOR = 'authenticator:login';

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
 * Takes the session an embedded React page signed in with, when this app has
 * none of its own.
 *
 * A migrated sign-in page authenticates on the React side, which writes only
 * its own entry. Without this, the sign-in succeeds and this app still
 * believes nobody is signed in.
 *
 * Call before `session.setup()`, so the restore reads what this writes.
 */
export function adoptReactSession() {
  const own = readStoredEntry(EMBER_AUTH_SESSION_KEY) as
    | { authenticated?: { b64token?: unknown } }
    | null;

  if (typeof own?.authenticated?.b64token === 'string') {
    return;
  }

  const entry = readStoredEntry(REACT_AUTH_SESSION_KEY) as Record<string, unknown> | null;
  const { token, userId, b64token } = entry ?? {};

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
