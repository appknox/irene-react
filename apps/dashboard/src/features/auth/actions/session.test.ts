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
  it('writes the session to localStorage', () => {
    startSession(queryClient, { token: 'tok3n', user_id: 42 });

    expect(getStoredSession()).toEqual(buildSession({ userId: 42, token: 'tok3n' }));
  });

  it('seeds the session query cache, so the next guard sends no api/check', () => {
    const session = startSession(queryClient, { token: 'tok3n', user_id: 42 });

    expect(queryClient.getQueryData(sessionCheckOptions().queryKey)).toEqual(session);
  });
});

describe('endSession', () => {
  it('removes the session from localStorage', () => {
    startSession(queryClient, { token: 'tok3n', user_id: 42 });

    endSession(queryClient);

    expect(getStoredSession()).toBeNull();
  });

  it('clears the query cache', () => {
    startSession(queryClient, { token: 'tok3n', user_id: 42 });

    endSession(queryClient);

    expect(queryClient.getQueryData(sessionCheckOptions().queryKey)).toBeNull();
  });

  it('throws nothing when no session is stored', () => {
    expect(() => endSession(queryClient)).not.toThrow();
    expect(getStoredSession()).toBeNull();
  });

  it('resets the organization, vulnerability and dashboard stores', () => {
    startSession(queryClient, { token: 'tok3n', user_id: 42 });
    signedInContext();

    endSession(queryClient);

    expect(organizationStore.getState().selected).toBeNull();
    expect(organizationStore.getState().me).toBeNull();
    expect(vulnerabilityStore.getState().all).toEqual([]);
    expect(configurationStore.getState().dashboardUrl()).toBe('');
    expect(configurationStore.getState().hasFetchedDashboard).toBe(false);
  });

  it('resets the frontend and server configuration stores', () => {
    signedInContext();

    endSession(queryClient);

    expect(configurationStore.getState().hasFetchedFrontend).toBe(false);
    expect(configurationStore.getState().hasFetchedServer).toBe(false);
    expect(configurationStore.getState().frontendData.name).toBe('');
  });
});
