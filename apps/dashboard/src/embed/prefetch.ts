import { queryClient } from '@irene/api';
import { offerHandedOverResponses } from '@irene/api/utils/response-handoff';
import { getStoredSession } from '@irene/api/utils/session';

import { loadConfiguration } from '@/actions/load-configuration';
import { setupUserAndOrgContext } from '@/actions/setup-user-context';

import { applyEmbedConfig, type MountOptions } from './mount';

/**
 * Starts loading what every page of this application needs, before one is
 * mounted.
 *
 * A host renders these pages inside a route of its own, so it finishes its own
 * loading before the element exists to mount into. Called early enough, this
 * runs the two sets of requests alongside each other instead of one after the
 * other, and the page finds its cache warm.
 *
 * Nothing is awaited and nothing is thrown: a failure here is retried by the
 * page's own loader, which is the one that reports it.
 *
 * @param options - The configuration and handed-over responses, as given at mount.
 */
export function prefetchIrenePage(options: Pick<MountOptions, 'config' | 'responses'> = {}) {
  applyEmbedConfig(options.config);

  if (options.responses) {
    offerHandedOverResponses(options.responses);
  }

  const session = getStoredSession();

  void loadConfiguration(queryClient).catch(() => {});

  if (session) {
    void setupUserAndOrgContext(queryClient, session.userId).catch(() => {});
  }
}
