import { isAxiosError } from 'axios';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { SsoService } from '@irene/api/services/sso';
import { buildSsoCheck } from '@tests/factories';
import { apiUrl, server } from '@tests/server';

const CHECK_URL = apiUrl('api/v2/sso/check');

/** Captures the request msw received, so assertions can read what was sent. */
function interceptCheck(respond: () => Response) {
  const seen: { body: unknown; method: string } = { body: undefined, method: '' };

  server.use(
    http.post(CHECK_URL, async ({ request }) => {
      seen.body = await request.json();
      seen.method = request.method;

      return respond();
    })
  );

  return seen;
}

describe('SsoService.check', () => {
  describe('when the organisation is found', () => {
    it('posts to the v2 sso check endpoint', async () => {
      const seen = interceptCheck(() => HttpResponse.json(buildSsoCheck()));

      await SsoService.check('someone@appknox.com');

      expect(seen.method).toBe('POST');
    });

    it('sends only the username', async () => {
      const seen = interceptCheck(() => HttpResponse.json(buildSsoCheck()));

      await SsoService.check('someone@appknox.com');

      expect(seen.body).toEqual({ username: 'someone@appknox.com' });
    });

    it('returns the response body unchanged', async () => {
      const response = buildSsoCheck({ is_saml: true, token: 'tok' });

      interceptCheck(() => HttpResponse.json(response));

      await expect(SsoService.check('someone@appknox.com')).resolves.toEqual(response);
    });
  });

  describe('when the request fails', () => {
    it('keeps the status and the field errors from a 400', async () => {
      interceptCheck(() =>
        HttpResponse.json({ username: ['Enter a valid email address.'] }, { status: 400 })
      );

      const error = await SsoService.check('nope').catch((reason: unknown) => reason);

      expect(isAxiosError(error)).toBe(true);
      expect(isAxiosError(error) ? error.status : undefined).toBe(400);

      expect(isAxiosError(error) ? error.response?.data : undefined).toEqual({
        username: ['Enter a valid email address.'],
      });
    });

    it('rejects rather than resolving undefined on a 403', async () => {
      interceptCheck(() => HttpResponse.json({ detail: 'Forbidden' }, { status: 403 }));

      await expect(SsoService.check('someone@appknox.com')).rejects.toThrow('403');
    });

    it('propagates a server error', async () => {
      interceptCheck(() => HttpResponse.json({}, { status: 500 }));

      await expect(SsoService.check('someone@appknox.com')).rejects.toThrow('500');
    });
  });

  describe('edge cases', () => {
    it('sends an empty username rather than dropping the field', async () => {
      const seen = interceptCheck(() => HttpResponse.json(buildSsoCheck()));

      await SsoService.check('');

      expect(seen.body).toEqual({ username: '' });
    });
  });
});
