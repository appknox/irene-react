import { describe, expect, it } from 'vitest';

import { queryClient } from '@irene/api/query-client';
import { getStoredSession } from '@irene/api/utils/session';

import { endSession, startSession } from '@/features/auth/actions/session';
import { sessionCheckOptions } from '@/features/auth/queries/session';
import { buildSession } from '@tests/factories';

describe('startSession', () => {
  it('stores the session, so the next visit restores it', () => {
    startSession(queryClient, { token: 'tok3n', user_id: 42 });

    expect(getStoredSession()).toEqual(buildSession({ userId: 42, token: 'tok3n' }));
  });

  it('seeds the cache, so a guard does not re-check what was just granted', () => {
    const session = startSession(queryClient, { token: 'tok3n', user_id: 42 });

    expect(queryClient.getQueryData(sessionCheckOptions().queryKey)).toEqual(session);
  });
});

describe('endSession', () => {
  it('forgets the stored session', () => {
    startSession(queryClient, { token: 'tok3n', user_id: 42 });

    endSession(queryClient);

    expect(getStoredSession()).toBeNull();
  });

  it('empties the cache, so a guard does not read a session that is gone', () => {
    startSession(queryClient, { token: 'tok3n', user_id: 42 });

    endSession(queryClient);

    expect(queryClient.getQueryData(sessionCheckOptions().queryKey)).toBeNull();
  });

  it('is safe when there was no session to begin with', () => {
    expect(() => endSession(queryClient)).not.toThrow();
    expect(getStoredSession()).toBeNull();
  });
});
