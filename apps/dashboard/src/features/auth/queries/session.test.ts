import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import { queryClient } from '@irene/api/query-client';
import { AuthEndpoints } from '@irene/api/services/auth';
import { getStoredSession, storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';

import { sessionCheckOptions } from '@/features/auth/queries/session';
import { buildSession } from '@tests/factories';
import { buildAPITestURL, server } from '@tests/server';

const CHECK_URL = buildAPITestURL(AuthEndpoints.check());
const session = buildSession();

afterEach(() => {
  window.localStorage.clear();
  queryClient.clear();
});

describe('sessionCheckOptions', () => {
  describe('when a session is stored', () => {
    it('resolves to the stored session when api/check answers 200', async () => {
      storeSession(session);
      server.use(http.post(CHECK_URL, () => HttpResponse.json({})));

      await expect(queryClient.query(sessionCheckOptions())).resolves.toEqual(session);
    });

    it('sends the stored credential in the Authorization header', async () => {
      let authorization: string | null = null;

      storeSession(session);

      server.use(
        http.post(CHECK_URL, ({ request }) => {
          authorization = request.headers.get('Authorization');

          return HttpResponse.json({});
        })
      );

      await queryClient.query(sessionCheckOptions());

      expect(authorization).toBe(`Basic ${session.b64token}`);
    });
  });

  describe('when nothing is stored', () => {
    // onUnhandledRequest is 'error', so any request here would fail the test.
    it('resolves to null and sends no request when nothing is stored', async () => {
      await expect(queryClient.query(sessionCheckOptions())).resolves.toBeNull();
    });
  });

  describe('when the credential is refused', () => {
    it('resolves to null and clears the stored session when api/check answers 401', async () => {
      storeSession(session);

      server.use(
        http.post(CHECK_URL, () =>
          HttpResponse.json(
            { detail: 'Invalid token.' },
            { status: HTTP_STATUS_CODES.UNAUTHORIZED }
          )
        )
      );

      await expect(queryClient.query(sessionCheckOptions())).resolves.toBeNull();
      expect(getStoredSession()).toBeNull();
    });

    it('resolves to null and clears the stored session when api/check never answers', async () => {
      storeSession(session);

      server.use(
        http.post(CHECK_URL, () =>
          HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
        )
      );

      await expect(queryClient.query(sessionCheckOptions())).resolves.toBeNull();
      expect(getStoredSession()).toBeNull();
    });
  });
});
