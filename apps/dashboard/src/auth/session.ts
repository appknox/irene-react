import { getB64Token } from '@/auth/token';

export const SESSION_STORAGE_KEY = 'appknox_session';

export interface Session {
  token: string;
  userId: number;
  b64token: string;
}

/** What the login and check endpoints return. */
export interface SessionResponse {
  token: string;
  user_id: number;
}

export const toSession = ({ token, user_id: userId }: SessionResponse): Session => ({
  token,
  userId,
  b64token: getB64Token(userId, token),
});

const isSession = (value: unknown): value is Session => {
  const session = value as Session | null;

  return (
    typeof session?.token === 'string' &&
    typeof session?.userId === 'number' &&
    typeof session?.b64token === 'string'
  );
};

/** Blocked storage or a bad entry reads as signed out. */
export function getSession(): Session | null {
  let stored: string | null;

  try {
    stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }

  if (!stored) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(stored);

    return isSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Throws on storage failure — a login that silently vanishes is worse. */
export function setSession(session: Session): void {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Nothing stored means nothing to clear.
  }
}

export const isAuthenticated = (): boolean => getSession() !== null;
