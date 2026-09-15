import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildBasicCredential,
  clearStoredSession,
  createSessionFromResponse,
  encodeBase64Utf8,
  getAuthorizationHeader,
  getSignedInUserId,
  getStoredSession,
  isSignedIn,
  SESSION_STORAGE_KEY,
  storeSession,
  type Session,
} from '@irene/api/utils/session';

const session: Session = { token: 'tok3n', userId: 42, b64token: 'NDI6dG9rM24=' };

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('createSessionFromResponse', () => {
  it('builds the credential from the response', () => {
    expect(createSessionFromResponse({ token: 'tok3n', user_id: 42 })).toEqual(session);
  });
});

describe('getStoredSession', () => {
  it('returns null when nothing is stored', () => {
    expect(getStoredSession()).toBeNull();
  });

  it('returns what storeSession wrote', () => {
    storeSession(session);

    expect(getStoredSession()).toEqual(session);
  });

  it('treats an unparseable entry as signed out', () => {
    window.localStorage.setItem(SESSION_STORAGE_KEY, 'not json');

    expect(getStoredSession()).toBeNull();
  });

  it('treats an entry of the wrong shape as signed out', () => {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'tok3n' }));

    expect(getStoredSession()).toBeNull();
  });

  it('treats blocked storage as signed out', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    expect(getStoredSession()).toBeNull();
  });
});

describe('storeSession', () => {
  it('surfaces a storage failure rather than losing the session quietly', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(() => storeSession(session)).toThrow('quota exceeded');
  });
});

describe('clearStoredSession', () => {
  it('removes a stored session', () => {
    storeSession(session);
    clearStoredSession();

    expect(getStoredSession()).toBeNull();
  });

  it('does nothing when there is no session', () => {
    expect(() => clearStoredSession()).not.toThrow();
  });
});

describe('isSignedIn', () => {
  it('is false with no session and true with one', () => {
    expect(isSignedIn()).toBe(false);

    storeSession(session);

    expect(isSignedIn()).toBe(true);
  });
});

describe('getSignedInUserId', () => {
  it('returns the stored user id', () => {
    storeSession(session);

    expect(getSignedInUserId()).toBe(42);
  });

  it('returns undefined when signed out', () => {
    expect(getSignedInUserId()).toBeUndefined();
  });

  it('returns undefined when the stored entry is corrupt', () => {
    window.localStorage.setItem(SESSION_STORAGE_KEY, '{"userId":"42"}');

    expect(getSignedInUserId()).toBeUndefined();
  });
});

describe('getAuthorizationHeader', () => {
  it('builds the Basic header from the stored credential', () => {
    storeSession(session);

    expect(getAuthorizationHeader()).toBe(`Basic ${session.b64token}`);
  });

  it('returns undefined when signed out rather than an empty Basic header', () => {
    expect(getAuthorizationHeader()).toBeUndefined();
  });

  it('returns undefined when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    expect(getAuthorizationHeader()).toBeUndefined();
  });
});

describe('encodeBase64Utf8', () => {
  it('encodes plain ascii', () => {
    expect(encodeBase64Utf8('1:abc')).toBe('MTphYmM=');
  });

  /**
   * The expected values come from the Ember implementation, so a token minted
   * by either app is accepted by the backend unchanged.
   */
  it.each([
    ['7:пароль', 'NzrQv9Cw0YDQvtC70Yw='],
    ['9:日本語-token', 'OTrml6XmnKzoqp4tdG9rZW4='],
    ['3:café', 'MzpjYWbDqQ=='],
  ])('encodes %s beyond latin1', (input, expected) => {
    expect(encodeBase64Utf8(input)).toBe(expected);
  });

  it('encodes an empty string', () => {
    expect(encodeBase64Utf8('')).toBe('');
  });
});

describe('buildBasicCredential', () => {
  it('joins the user id and token with a colon', () => {
    expect(buildBasicCredential(42, 'tok3n')).toBe('NDI6dG9rM24=');
  });

  it('matches a hand-built credential', () => {
    expect(buildBasicCredential(1, 'abc')).toBe(encodeBase64Utf8('1:abc'));
  });
});
