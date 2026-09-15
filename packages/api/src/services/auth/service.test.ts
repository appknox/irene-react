import { faker } from '@faker-js/faker';
import { isAxiosError } from 'axios';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { AuthService } from '@irene/api/services/auth';
import { apiUrl, server } from '@tests/server';

const CHECK_URL = apiUrl('api/check');
const B64TOKEN = 'NDI6dG9rM24=';

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

describe('AuthService.check', () => {
  describe('when the credential is live', () => {
    it('posts to the v1 check endpoint with the credential', async () => {
      const seen = interceptCheck(() => HttpResponse.json({}));

      await AuthService.check(B64TOKEN);

      expect(seen.method).toBe('POST');
      expect(seen.authorization).toBe(`Basic ${B64TOKEN}`);
    });

    it('sends an empty body, as irene does', async () => {
      const seen = interceptCheck(() => HttpResponse.json({}));

      await AuthService.check(B64TOKEN);

      expect(seen.body).toEqual({});
    });
  });

  describe('when the credential is refused', () => {
    it('keeps the status and detail from a 401', async () => {
      interceptCheck(() => HttpResponse.json({ detail: 'Invalid token.' }, { status: 401 }));

      const error = await AuthService.check(B64TOKEN).catch((reason: unknown) => reason);

      expect(isAxiosError(error) ? error.status : undefined).toBe(401);

      expect(isAxiosError(error) ? error.response?.data : undefined).toEqual({
        detail: 'Invalid token.',
      });
    });

    it('rejects an inactive account, which the backend reports separately', async () => {
      interceptCheck(() =>
        HttpResponse.json({ detail: 'User inactive or deleted.' }, { status: 401 })
      );

      const error = await AuthService.check(B64TOKEN).catch((reason: unknown) => reason);

      expect(isAxiosError(error) ? error.response?.data : undefined).toEqual({
        detail: 'User inactive or deleted.',
      });
    });

    it('propagates a server error instead of treating it as signed out', async () => {
      interceptCheck(() => HttpResponse.json({}, { status: 500 }));

      await expect(AuthService.check(B64TOKEN)).rejects.toThrow('500');
    });
  });

  describe('edge cases', () => {
    // axios trims the header, so an empty credential produces a malformed one.
    it('sends a malformed header rather than omitting it', async () => {
      const seen = interceptCheck(() => HttpResponse.json({}));

      await AuthService.check('');

      expect(seen.authorization).toBe('Basic');
    });
  });
});

describe('AuthService.login', () => {
  const LOGIN_URL = apiUrl('api/login');

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
        HttpResponse.json({ detail: 'Invalid username or password' }, { status: 401 })
      );

      const error = await AuthService.login(credentials).catch((reason: unknown) => reason);

      expect(isAxiosError(error) ? error.status : undefined).toBe(401);

      expect(isAxiosError(error) ? error.response?.data : undefined).toEqual({
        detail: 'Invalid username or password',
      });
    });

    it('propagates a server error', async () => {
      interceptLogin(() => HttpResponse.json({}, { status: 500 }));

      await expect(AuthService.login(credentials)).rejects.toThrow('500');
    });
  });
});
