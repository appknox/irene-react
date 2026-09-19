import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect } from 'react';

import { getStoredSession, IRENE_AUTH_SESSION_KEY, type Session } from '@irene/api/utils/session';

import { endSession } from '@/features/auth/actions/session';
import { sessionCheckOptions } from '@/features/auth/queries/session';

/**
 * Calls back when the stored session changes somewhere other than this tab.
 *
 * The browser fires `storage` on every other document of the same origin, never
 * the one that made the change — so this only ever hears about another tab, or
 * someone editing storage by hand. The tab that acted has already navigated.
 *
 * @param onChange - Given the session as it now stands, or null when it is gone.
 */
function useStoredSessionChange(onSessionChange: (session: Session | null) => void) {
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      // A null key means the whole store was cleared, which takes ours with it.
      const touchedSession = event.key === null || event.key === IRENE_AUTH_SESSION_KEY;

      if (touchedSession) {
        onSessionChange(getStoredSession());
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => window.removeEventListener('storage', handleStorage);
  }, [onSessionChange]);
}

/**
 * Sends this tab to the login page once the session disappears elsewhere, so
 * signing out in one tab signs out the rest. Mount on the signed-in pages.
 */
export function useSessionWatch() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Handles the session change event.
  const onSessionChange = useCallback(
    (session: Session | null) => {
      if (!session) {
        endSession(queryClient);
        navigate({ to: '/login', search: { unauthenticated: true } });
      }
    },
    [navigate, queryClient]
  );

  useStoredSessionChange(onSessionChange);
}

/**
 * Sends this tab into the dashboard once a session appears elsewhere, so
 * signing in on one tab lets the rest follow. Mount on the signed-out pages.
 */
export function useSignedInElsewhere() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const onSessionChange = useCallback(
    (session: Session | null) => {
      if (session) {
        queryClient.setQueryData(sessionCheckOptions().queryKey, session);
        navigate({ to: '/' });
      }
    },
    [navigate, queryClient]
  );

  useStoredSessionChange(onSessionChange);
}
