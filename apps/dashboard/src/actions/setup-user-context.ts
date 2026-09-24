import type { QueryClient } from '@tanstack/react-query';

import { configurationStore } from '@irene/api/stores/configuration';
import { organizationStore } from '@irene/api/stores/organization';
import { vulnerabilityStore } from '@irene/api/stores/vulnerability';
import { akMT, setLocale } from '@irene/translations/intl';
import { isSupportedLocale, storeLocale } from '@irene/translations/locale';
import { akNotify } from '@irene/ui/notify';
import type { ApiOrganization } from '@irene/api/services/organization';
import type { ApiUser } from '@irene/api/services/user';
import type { ApiPage } from '@irene/api/utils/pagination';

import {
  organizationMembershipOptions,
  organizationMeOptions,
  organizationsOptions,
  storeknoxOrganizationOptions,
} from '@/queries/organization';

import { dashboardConfigurationOptions } from '@/queries/configuration';
import { userOptions } from '@/queries/user';
import { vulnerabilitiesOptions } from '@/queries/vulnerability';

/**
 * Records the organization the account works in, and its standing there.
 *
 * An account belongs to one organization in practice, and the first is the one
 * the product shows. An account with none is told so and left where it is.
 *
 * @param queryClient - The cache to load through.
 * @param organizations - The organizations the account belongs to.
 */
async function _selectOrganization(
  queryClient: QueryClient,
  organizations: ApiPage<ApiOrganization>,
  userId: number
) {
  const [selected] = organizations.items;

  if (!selected) {
    akNotify.error(akMT('organizationMissingContactSupport'));

    return;
  }

  // Asked for together: what the account may do there, and how it came to be a member.
  const [me] = await Promise.all([
    queryClient.query(organizationMeOptions(selected.id)),
    queryClient.query(organizationMembershipOptions(selected.id, userId)),
  ]);

  organizationStore.getState().select(selected, me);
}

/**
 * Warms the StoreKnox organization, tolerating a deployment without one.
 *
 * @param queryClient - The cache to load through.
 */
async function _loadStoreknoxOrganization(queryClient: QueryClient) {
  try {
    await queryClient.query(storeknoxOrganizationOptions());
  } catch {
    // A deployment without StoreKnox does nothing.
  }
}

/**
 * Renders the interface in the account's own language, which outranks whatever
 * the browser was last set to and replaces it, so the next signed-out page
 * opens in the same language.
 *
 * @param user - The signed-in account.
 */
async function _applyUserLocale(user: ApiUser) {
  if (isSupportedLocale(user.lang)) {
    storeLocale(user.lang);

    await setLocale(user.lang);
  }
}

/**
 * Loads what every signed-in page can then rely on.
 *
 * The organizations, the hosts the product links to, and the vulnerability
 * catalogue are asked for together, since none describes the other. StoreKnox
 * follows and may fail. The account comes last, and its language is applied
 * once known.
 *
 * @param queryClient - The cache to load through.
 * @param userId - The user id the session carries.
 * @returns The signed-in account.
 */
export async function setupUserAndOrgContext(queryClient: QueryClient, userId: number) {
  const [organizations, dashboardConfiguration, vulnerabilities] = await Promise.all([
    queryClient.query(organizationsOptions()),
    queryClient.query(dashboardConfigurationOptions()),
    queryClient.query(vulnerabilitiesOptions()),
  ]);

  configurationStore.getState().setDashboardConfiguration(dashboardConfiguration);
  vulnerabilityStore.getState().load(vulnerabilities);

  await _selectOrganization(queryClient, organizations, userId);
  await _loadStoreknoxOrganization(queryClient);

  const user = await queryClient.query(userOptions(userId));
  await _applyUserLocale(user);

  return user;
}
