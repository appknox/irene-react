import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  SESSION_STORAGE_KEY,
  clearSession,
  getSession,
  isAuthenticated,
  setSession,
  toSession,
  type Session,
} from '@/auth/session';

const session: Session = { token: 'tok3n', userId: 42, b64token: 'NDI6dG9rM24=' };

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('toSession', () => {
  it('builds the credential from the response', () => {
    expect(toSession({ token: 'tok3n', user_id: 42 })).toEqual(session);
  });
});

describe('getSession', () => {
  it('returns null when nothing is stored', () => {
    expect(getSession()).toBeNull();
  });

  it('returns what setSession wrote', () => {
    setSession(session);

    expect(getSession()).toEqual(session);
  });

  it('treats an unparseable entry as signed out', () => {
    window.localStorage.setItem(SESSION_STORAGE_KEY, 'not json');

    expect(getSession()).toBeNull();
  });

  it('treats an entry of the wrong shape as signed out', () => {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'tok3n' }));

    expect(getSession()).toBeNull();
  });

  it('treats blocked storage as signed out', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    expect(getSession()).toBeNull();
  });
});

describe('setSession', () => {
  it('surfaces a storage failure rather than losing the session quietly', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(() => setSession(session)).toThrow('quota exceeded');
  });
});

describe('clearSession', () => {
  it('removes a stored session', () => {
    setSession(session);
    clearSession();

    expect(getSession()).toBeNull();
  });

  it('does nothing when there is no session', () => {
    expect(() => clearSession()).not.toThrow();
  });
});

describe('isAuthenticated', () => {
  it('is false with no session and true with one', () => {
    expect(isAuthenticated()).toBe(false);

    setSession(session);

    expect(isAuthenticated()).toBe(true);
  });
});
