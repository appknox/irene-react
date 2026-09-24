import { createStore } from 'zustand/vanilla';
import type { ApiOrganization, ApiOrganizationMe } from '@irene/api/services/organization';

/**
 * The organization the app is working in, and what this account may do there.
 *
 * An account can belong to more than one organization, but the product shows
 * one at a time, so the choice is held here rather than passed down. `me` is
 * kept beside it because every permission check needs both.
 *
 * Lives in the API package because every app reads it: the choice decides which
 * organization the requests are about, not how one screen renders.
 *
 * @interface OrganizationStore
 * @property {ApiOrganization} selected - The organization in use, or null before one is chosen.
 * @property {ApiOrganizationMe} me - What this account may do in the selected organization.
 * @property {function} select - Records the organization in use, and the account's standing in it.
 * @property {function} clear - Forgets both, for signing out.
 */
interface OrganizationStore {
  selected: ApiOrganization | null;
  me: ApiOrganizationMe | null;
  select: (organization: ApiOrganization, me: ApiOrganizationMe) => void;
  clear: () => void;
}

const NONE_SELECTED = { selected: null, me: null };

export const organizationStore = createStore<OrganizationStore>((set) => ({
  ...NONE_SELECTED,
  select: (organization, me) => set({ selected: organization, me }),
  clear: () => set(NONE_SELECTED),
}));
