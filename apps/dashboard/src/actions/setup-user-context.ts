import type { QueryClient } from '@tanstack/react-query';

import { configurationStore } from '@irene/api/stores/configuration';
import { organizationStore } from '@irene/api/stores/organization';
import { vulnerabilityStore } from '@irene/api/stores/vulnerability';
import { isPluginEnabled } from '@irene/config';
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
import { installFreshchat } from '@/scripts/freshchat';
import { identifyForProductGuides, installProductGuides } from '@/scripts/pendo';

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

  // This loads more information about the user and their organization membership.
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
 * Loads the product guides and tells them who is reading, where the install runs them.
 *
 * @param user - The signed-in account.
 */
function _installProductGuides(user: ApiUser) {
  if (!isPluginEnabled('IRENE_ENABLE_PENDO')) {
    return;
  }

  const pendoKey = configurationStore.getState().integrationData.pendo_key;
  installProductGuides(pendoKey);

  /* An account with no address on record still gets the agent, unnamed. */
  if (user.email) {
    identifyForProductGuides({ id: user.id, email: user.email });
  }
}

/**
 * Installs the chat widget for this account, where the install has chat at all.
 *
 * It is installed here rather than in the navigation so a conversation survives
 * a move between pages, and the navigation only opens it.
 *
 * @param user - The account the conversation belongs to.
 */
function _installChatSupport(user: ApiUser) {
  const organizationName = organizationStore.getState().selected?.name;

  if (!user.freshchat_hash || !organizationName) {
    return;
  }

  installFreshchat(configurationStore.getState().freshchatKey(), {
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email ?? '',
    organizationName,
    hash: user.freshchat_hash,
  });
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

  _installChatSupport(user);
  _installProductGuides(user);

  return user;
}
