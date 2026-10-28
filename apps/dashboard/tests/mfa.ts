import { http, HttpResponse } from 'msw';

import { MfaEndpoints } from '@irene/api/services/mfa/endpoints';
import { buildMfa } from '@tests/factories';
import { server } from '@tests/server';
import type { ApiMfa } from '@irene/api/services/mfa';

/**
 * Answers the MFA list with both methods, the authenticator app first as the
 * server sends them, and whichever one is named as active.
 *
 * The security tab reads the list on every render, so every test that opens it
 * answers it. A test that changes the active method calls this again from its
 * handler, so the refetch after the change reads the new state.
 *
 * @param active - The active method, or nothing for an account with no second factor.
 */
export function mockMfaMethods(active?: ApiMfa['method']) {
  const methods = [
    buildMfa({ method: 1, enabled: active === 1 }),
    buildMfa({ method: 2, enabled: active === 2 }),
  ];

  server.use(
    http.get(`*/${MfaEndpoints.mfa()}`, () =>
      HttpResponse.json({ count: methods.length, next: null, previous: null, results: methods })
    )
  );
}
