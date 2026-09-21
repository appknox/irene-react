import { faker } from '@faker-js/faker';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { HTTP_STATUS_CODES } from '@irene/constants';

import { AuthEndpoints, AuthService } from '@irene/api/services/auth';
import { getApiErrorPayload, getApiErrorStatus } from '@irene/api/utils/errors';
import { storeSession } from '@irene/api/utils/session';
import { buildAPITestURL, server } from '@tests/server';

const CHECK_URL = buildAPITestURL(AuthEndpoints.check());
const LOGOUT_URL = buildAPITestURL(AuthEndpoints.logout());
const RECOVER_USERNAME = faker.internet.email();
const UNKNOWN_USERNAME = faker.internet.email();
const B64TOKEN = 'NDI6dG9rM24=';

/** The interceptor reads the credential from storage, so a signed-in test puts one there. */
const signedIn = () => storeSession({ token: 'tok3n', userId: 42, b64token: B64TOKEN });

afterEach(() => {
  window.localStorage.clear();
});

function interceptCheck(respond: () => Response) {
  const seen: { body: unknown; authorization: string | null; method: string } = {
    body: undefined,
    authorization: null,
    method: '',
  };

  server.use(
    http.post(CHECK_URL, async ({ request }) => {
      seen.body = await request.json();
      seen.authorization = request.headers.get('Authorization');
      seen.method = request.method;

      return respond();
    })
  );

  return seen;
}

describe('AuthService.checkSession', () => {
  beforeEach(signedIn);

  describe('when the credential is live', () => {
    it('posts to the v1 check endpoint with the credential', async () => {
      const seen = interceptCheck(() => HttpResponse.json({}));

      await AuthService.checkSession();

      expect(seen.method).toBe('POST');
      expect(seen.authorization).toBe(`Basic ${B64TOKEN}`);
    });

    it('sends an empty body, as irene does', async () => {
      const seen = interceptCheck(() => HttpResponse.json({}));

      await AuthService.checkSession();

      expect(seen.body).toEqual({});
    });
  });

  describe('when the credential is refused', () => {
    it('keeps the status and detail from a 401', async () => {
      interceptCheck(() =>
        HttpResponse.json({ detail: 'Invalid token.' }, { status: HTTP_STATUS_CODES.UNAUTHORIZED })
      );

      const error = await AuthService.checkSession().catch((reason: unknown) => reason);

      expect(getApiErrorStatus(error)).toBe(HTTP_STATUS_CODES.UNAUTHORIZED);

      expect(getApiErrorPayload(error)).toEqual({
        detail: 'Invalid token.',
      });
    });

    it('rejects an inactive account, which the backend reports separately', async () => {
      interceptCheck(() =>
        HttpResponse.json(
          { detail: 'User inactive or deleted.' },
          { status: HTTP_STATUS_CODES.UNAUTHORIZED }
        )
      );

      const error = await AuthService.checkSession().catch((reason: unknown) => reason);

      expect(getApiErrorPayload(error)).toEqual({
        detail: 'User inactive or deleted.',
      });
    });

    it('propagates a server error instead of treating it as signed out', async () => {
      interceptCheck(() =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      );

      await expect(AuthService.checkSession()).rejects.toThrow('500');
    });
  });

  describe('edge cases', () => {
    it('sends no credential at all when nothing is stored', async () => {
      window.localStorage.clear();

      const seen = interceptCheck(() => HttpResponse.json({}));

      await AuthService.checkSession();

      expect(seen.authorization).toBeNull();
    });
  });
});

describe('AuthService.login', () => {
  const LOGIN_URL = buildAPITestURL(AuthEndpoints.login());

  const credentials = {
    username: faker.internet.email(),
    password: faker.internet.password(),
  };

  function interceptLogin(respond: () => Response) {
    const seen: { body: unknown } = { body: undefined };

    server.use(
      http.post(LOGIN_URL, async ({ request }) => {
        seen.body = await request.json();

        return respond();
      })
    );

    return seen;
  }

  describe('when the credentials are accepted', () => {
    it('resolves to the token and user id', async () => {
      const response = { token: faker.string.alphanumeric(40), user_id: faker.number.int() };

      interceptLogin(() => HttpResponse.json(response));

      await expect(AuthService.login(credentials)).resolves.toEqual(response);
    });

    it('sends the username lowercased with the password', async () => {
      const seen = interceptLogin(() => HttpResponse.json({ token: 't', user_id: 1 }));

      await AuthService.login({ ...credentials, username: 'Jane.Doe@Example.COM' });

      expect(seen.body).toEqual({
        username: 'jane.doe@example.com',
        password: credentials.password,
      });
    });
  });

  describe('when the credentials are refused', () => {
    it('keeps the detail from a 401', async () => {
      interceptLogin(() =>
        HttpResponse.json(
          { detail: 'Invalid username or password' },
          { status: HTTP_STATUS_CODES.UNAUTHORIZED }
        )
      );

      const error = await AuthService.login(credentials).catch((reason: unknown) => reason);

      expect(getApiErrorStatus(error)).toBe(HTTP_STATUS_CODES.UNAUTHORIZED);

      expect(getApiErrorPayload(error)).toEqual({
        detail: 'Invalid username or password',
      });
    });

    it('propagates a server error', async () => {
      interceptLogin(() =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      );

      await expect(AuthService.login(credentials)).rejects.toThrow('500');
    });
  });
});

describe('AuthService.logout', () => {
  beforeEach(signedIn);

  it('posts to the v1 logout endpoint with the credential', async () => {
    const seen: { authorization: string | null; method: string } = {
      authorization: null,
      method: '',
    };

    server.use(
      http.post(LOGOUT_URL, ({ request }) => {
        seen.authorization = request.headers.get('Authorization');
        seen.method = request.method;

        return HttpResponse.json({});
      })
    );

    await AuthService.logout();

    expect(seen.method).toBe('POST');
    expect(seen.authorization).toBe(`Basic ${B64TOKEN}`);
  });

  it('propagates a refusal, leaving the caller to sign out locally anyway', async () => {
    server.use(
      http.post(LOGOUT_URL, () => HttpResponse.json({}, { status: HTTP_STATUS_CODES.UNAUTHORIZED }))
    );

    const error = await AuthService.logout().catch((reason: unknown) => reason);

    expect(getApiErrorStatus(error)).toBe(HTTP_STATUS_CODES.UNAUTHORIZED);
  });
});

describe('AuthService.recoverPassword', () => {
  const RECOVER_URL = buildAPITestURL(AuthEndpoints.recover());

  it('posts the username to the v2 forgot password endpoint', async () => {
    const seen: { body: unknown; authorization: string | null } = {
      body: undefined,
      authorization: null,
    };

    server.use(
      http.post(RECOVER_URL, async ({ request }) => {
        seen.body = await request.json();
        seen.authorization = request.headers.get('Authorization');

        return HttpResponse.json({});
      })
    );

    await AuthService.recoverPassword(RECOVER_USERNAME);

    expect(seen.body).toEqual({ username: RECOVER_USERNAME });

    // The caller is signed out, so there is no credential to send.
    expect(seen.authorization).toBeNull();
  });

  it('keeps the per-field errors from a 400, so the form can show them', async () => {
    server.use(
      http.post(RECOVER_URL, () =>
        HttpResponse.json(
          { username: ['No account uses that address'] },
          { status: HTTP_STATUS_CODES.BAD_REQUEST }
        )
      )
    );

    const error = await AuthService.recoverPassword(UNKNOWN_USERNAME).catch(
      (reason: unknown) => reason
    );

    expect(getApiErrorPayload(error)).toEqual({
      username: ['No account uses that address'],
    });
  });
});

describe('AuthService.login with a second factor', () => {
  const LOGIN_URL = buildAPITestURL(AuthEndpoints.login());

  /** Captures the login body msw received. */
  function sendLogin(respond: () => Response) {
    const seen: { body: unknown } = { body: undefined };

    server.use(
      http.post(LOGIN_URL, async ({ request }) => {
        seen.body = await request.json();

        return respond();
      })
    );

    return seen;
  }

  it('omits otp entirely on an attempt that has none', async () => {
    const seen = sendLogin(() => HttpResponse.json({ token: 't', user_id: 1 }));

    await AuthService.login({ username: 'jane', password: 'pw' });

    expect(seen.body).toEqual({ username: 'jane', password: 'pw' });
  });

  it('sends otp once there is a code to send', async () => {
    const seen = sendLogin(() => HttpResponse.json({ token: 't', user_id: 1 }));

    await AuthService.login({ username: 'jane', password: 'pw', otp: '123456' });

    expect(seen.body).toEqual({ username: 'jane', password: 'pw', otp: '123456' });
  });

  it('keeps the challenge from a 401, so the caller can ask for the code', async () => {
    sendLogin(() =>
      HttpResponse.json(
        { type: 'TOTP', forced: 'true' },
        { status: HTTP_STATUS_CODES.UNAUTHORIZED }
      )
    );

    const error = await AuthService.login({ username: 'jane', password: 'pw' }).catch(
      (reason: unknown) => reason
    );

    expect(getApiErrorPayload(error)).toEqual({
      type: 'TOTP',
      forced: 'true',
    });
  });
});

describe('AuthService reset password', () => {
  const TOKEN = 'reset-t0ken';
  const RESET_URL = buildAPITestURL(AuthEndpoints.resetPassword(TOKEN));

  it('checks a link with a GET before anything is typed', async () => {
    let method = '';

    server.use(
      http.get(RESET_URL, ({ request }) => {
        method = request.method;

        return HttpResponse.json({});
      })
    );

    await AuthService.verifyResetToken(TOKEN);

    expect(method).toBe('GET');
  });

  it('rejects a spent link', async () => {
    server.use(
      http.get(RESET_URL, () => HttpResponse.json({}, { status: HTTP_STATUS_CODES.NOT_FOUND }))
    );

    await expect(AuthService.verifyResetToken(TOKEN)).rejects.toThrow('404');
  });

  it('puts the new password under the snake_case name the API expects', async () => {
    let body: unknown;

    server.use(
      http.put(RESET_URL, async ({ request }) => {
        body = await request.json();

        return HttpResponse.json({});
      })
    );

    await AuthService.resetPassword({
      token: TOKEN,
      password: 'correct-horse',
      confirmPassword: 'correct-horse',
    });

    expect(body).toEqual({ password: 'correct-horse', confirm_password: 'correct-horse' });
  });
});
