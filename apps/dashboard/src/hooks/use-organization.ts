import { useStore } from 'zustand';
import { organizationStore } from '@irene/api/stores/organization';

/**
 * The organization the app is working in, and what this account may do there.
 *
 * @returns The selected organization and the account's standing in it, both
 * null until the signed-in pages have loaded them.
 */
export const useOrganization = () => useStore(organizationStore);
