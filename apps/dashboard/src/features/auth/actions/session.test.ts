import { describe, expect, it } from 'vitest';

import { queryClient } from '@irene/api/query-client';
import { configurationStore } from '@irene/api/stores/configuration';
import { organizationStore } from '@irene/api/stores/organization';
import { vulnerabilityStore } from '@irene/api/stores/vulnerability';
import { getStoredSession } from '@irene/api/utils/session';

import {
  buildDashboardConfig,
  buildFrontendConfiguration,
  buildOrganization,
  buildOrganizationMe,
  buildSession,
  buildVulnerability,
} from '@tests/factories';

import { endSession, startSession } from '@/features/auth/actions/session';
import { sessionCheckOptions } from '@/features/auth/queries/session';

/** Fills the stores as a signed-in session does. */
const signedInContext = () => {
  organizationStore.getState().select(buildOrganization(), buildOrganizationMe());
  vulnerabilityStore.getState().load([buildVulnerability()]);
  configurationStore.getState().setDashboardConfiguration(buildDashboardConfig());

  configurationStore
    .getState()
    .setFrontendConfiguration(buildFrontendConfiguration({ name: 'Securely' }));
};

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

  it('clears the organization, vulnerability and dashboard state', () => {
    startSession(queryClient, { token: 'tok3n', user_id: 42 });
    signedInContext();

    endSession(queryClient);

    expect(organizationStore.getState().selected).toBeNull();
    expect(organizationStore.getState().me).toBeNull();
    expect(vulnerabilityStore.getState().all).toEqual([]);
    expect(configurationStore.getState().dashboardUrl()).toBe('');
    expect(configurationStore.getState().hasFetchedDashboard).toBe(false);
  });

  it('clears the frontend and server configuration too', () => {
    signedInContext();

    endSession(queryClient);

    expect(configurationStore.getState().hasFetchedFrontend).toBe(false);
    expect(configurationStore.getState().hasFetchedServer).toBe(false);
    expect(configurationStore.getState().frontendData.name).toBe('');
  });
});
