import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import { sessionCheckOptions } from '@irene/api/queries/session';
import { queryClient } from '@irene/api/query-client';
import { getStoredSession, storeSession, type Session } from '@irene/api/utils/session';
import { apiUrl, server } from '@tests/server';

const CHECK_URL = apiUrl('api/check');
const session: Session = { token: 'tok3n', userId: 42, b64token: 'NDI6dG9rM24=' };

afterEach(() => {
  window.localStorage.clear();
  queryClient.clear();
});

describe('sessionCheckOptions', () => {
  describe('when a session is stored', () => {
    it('resolves to the session once the credential is confirmed', async () => {
      storeSession(session);
      server.use(http.post(CHECK_URL, () => HttpResponse.json({})));

      await expect(queryClient.query(sessionCheckOptions())).resolves.toEqual(session);
    });

    it('checks with the stored credential', async () => {
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
    it('resolves to null without calling the API', async () => {
      await expect(queryClient.query(sessionCheckOptions())).resolves.toBeNull();
    });
  });

  describe('when the credential is refused', () => {
    it('resolves to null and clears the stored session on a 401', async () => {
      storeSession(session);

      server.use(
        http.post(CHECK_URL, () => HttpResponse.json({ detail: 'Invalid token.' }, { status: 401 }))
      );

      await expect(queryClient.query(sessionCheckOptions())).resolves.toBeNull();
      expect(getStoredSession()).toBeNull();
    });

    it('rejects on a server error and keeps the stored session', async () => {
      storeSession(session);
      server.use(http.post(CHECK_URL, () => HttpResponse.json({}, { status: 500 })));

      await expect(queryClient.query({ ...sessionCheckOptions(), retry: false })).rejects.toThrow(
        '500'
      );

      expect(getStoredSession()).toEqual(session);
    });
  });
});
