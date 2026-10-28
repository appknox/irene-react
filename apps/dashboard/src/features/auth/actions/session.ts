import type { QueryClient } from '@tanstack/react-query';

import {
  clearStoredSession,
  createSessionFromResponse,
  storeSession,
} from '@irene/api/utils/session';

import { configurationStore } from '@irene/api/stores/configuration';
import { organizationStore } from '@irene/api/stores/organization';
import { rateLimitStore } from '@irene/api/stores/rate-limit';
import { vulnerabilityStore } from '@irene/api/stores/vulnerability';
import { closeWebsocketConnection } from '@irene/websocket';
import type { ApiSessionResponse } from '@irene/api/services/auth';

import { sessionCheckOptions } from '@/features/auth/queries/session';
import { uploadAppStore } from '@/features/upload-app/store';
import { destroyFreshchat } from '@/scripts/freshchat';
import { signOutOfFreshdesk } from '@/scripts/freshdesk';

/**
 * Records a session the app has just been granted: stored for the next visit,
 * and seeded into the cache, since the API granting it is confirmation enough.
 *
 * @param queryClient - The cache holding what was last confirmed.
 * @param response - The token and user id from a sign-in.
 * @returns The stored session.
 */
export function startSession(queryClient: QueryClient, response: ApiSessionResponse) {
  const session = createSessionFromResponse(response);

  storeSession(session);
  queryClient.setQueryData(sessionCheckOptions().queryKey, session);

  return session;
}

/**
 * Releases what the session holds outside React: the support widgets, the
 * socket connection and the stored credential.
 *
 * Enough on its own when the page is about to be loaded again, since the cache
 * and the stores go with it.
 */
export function releaseSession() {
  /* Both widgets hold the account, so they go with the session. */
  destroyFreshchat();
  signOutOfFreshdesk();

  /* The room belongs to the account, so a connection outliving it would carry one account's events into the next. */
  closeWebsocketConnection();
  clearStoredSession();
}

/**
 * Forgets the session: the credential, the cache, and everything the stores
 * were told about the account. Safe to call when there is none, so a failed
 * sign-out can still leave the user signed out.
 *
 * The stores outlive the session because they are module singletons, so a
 * second account signing in to the same tab would otherwise read the first
 * account's organization, permissions and hosts until each was overwritten.
 * The configuration goes with them, and the next page load requests it again.
 *
 * @param queryClient - The cache to clear.
 */
export function endSession(queryClient: QueryClient) {
  releaseSession();

  queryClient.clear();
  queryClient.setQueryData(sessionCheckOptions().queryKey, null);

  organizationStore.getState().clear();
  vulnerabilityStore.getState().clear();
  configurationStore.getState().clear();

  /* The uploads are this account's files, and the throttle is its own clock. */
  uploadAppStore.getState().clear();
  rateLimitStore.getState().clearThrottle();
}
