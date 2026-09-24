import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildBasicCredential,
  clearStoredSession,
  createSessionFromResponse,
  encodeBase64Utf8,
  getAuthorizationHeader,
  getSignedInUserId,
  getStoredSession,
  IRENE_AUTH_SESSION_KEY,
  isSignedIn,
  storeSession,
  type IreneAuthSession,
} from '@irene/api/utils/session';

const session: IreneAuthSession = { token: 'tok3n', userId: 42, b64token: 'NDI6dG9rM24=' };

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

  it('returns the session storeSession wrote', () => {
    storeSession(session);

    expect(getStoredSession()).toEqual(session);
  });

  it('returns null for an entry that is not valid JSON', () => {
    window.localStorage.setItem(IRENE_AUTH_SESSION_KEY, 'not json');

    expect(getStoredSession()).toBeNull();
  });

  it('returns null for an entry of the wrong shape', () => {
    window.localStorage.setItem(IRENE_AUTH_SESSION_KEY, JSON.stringify({ token: 'tok3n' }));

    expect(getStoredSession()).toBeNull();
  });

  it('returns null when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    expect(getStoredSession()).toBeNull();
  });
});

describe('storeSession', () => {
  it('rethrows when localStorage refuses the write', () => {
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

  it('throws nothing when no session is stored', () => {
    expect(() => clearStoredSession()).not.toThrow();
  });
});

describe('isSignedIn', () => {
  it('is false with no session stored and true with one', () => {
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

  it('returns undefined when no session is stored', () => {
    expect(getSignedInUserId()).toBeUndefined();
  });

  it('returns undefined when the stored entry is unreadable', () => {
    window.localStorage.setItem(IRENE_AUTH_SESSION_KEY, '{"userId":"42"}');

    expect(getSignedInUserId()).toBeUndefined();
  });
});

describe('getAuthorizationHeader', () => {
  it('builds the Basic header from the stored credential', () => {
    storeSession(session);

    expect(getAuthorizationHeader()).toBe(`Basic ${session.b64token}`);
  });

  it('returns undefined when no session is stored', () => {
    expect(getAuthorizationHeader()).toBeUndefined();
  });

  it('returns undefined when localStorage throws', () => {
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

  it('matches a credential built with btoa', () => {
    expect(buildBasicCredential(1, 'abc')).toBe(encodeBase64Utf8('1:abc'));
  });
});
