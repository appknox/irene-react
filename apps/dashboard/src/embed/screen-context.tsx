import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { queryClient } from '@irene/api';
import { getStoredSession } from '@irene/api/utils/session';

import { loadConfiguration } from '@/actions/load-configuration';
import { setupUserAndOrgContext } from '@/actions/setup-user-context';

/**
 * Loads what every screen of this app assumes is already there.
 *
 * A screen reads the organization and the deployment's configuration from
 * stores the signed-in routes fill. Rendered outside those routes, nothing
 * fills them, so this does.
 *
 * The screen is rendered straight away rather than held back. Every query that
 * needs the organization is disabled until there is one, so a screen with no
 * context yet shows its own waiting state and starts fetching the moment the
 * store fills — which is what it does inside this app's own routes. Holding it
 * back would show nothing at all until the slowest of these answered.
 *
 * Loaded once per session: later screens find it done.
 *
 * @param props.children - The screen to render.
 */
export function ScreenContext({ children }: Readonly<{ children: ReactNode }>) {
  useQuery({
    queryKey: ['embed', 'context'],

    queryFn: async () => {
      const session = getStoredSession();

      await loadConfiguration(queryClient);

      if (session) {
        await setupUserAndOrgContext(queryClient, session.userId);
      }

      return true;
    },

    staleTime: Infinity,
  });

  return children;
}
