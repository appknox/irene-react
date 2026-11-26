import { useQuery } from '@tanstack/react-query';

import {
  oidcProviderOptions,
  organizationArchivesOptions,
  organizationCleanupPreferenceOptions,
  organizationEmailDomainsOptions,
  organizationPreferenceOptions,
  organizationRegisteredDevicesOptions,
  organizationSsoOptions,
  samlIdpMetadataOptions,
} from '@/queries/organization';

import { getSignedInUserId } from '@irene/api/utils/session';
import { useOrganization } from '@/hooks/use-organization';
import { userOptions } from '@/queries/user';

/* The page every table on this screen opens on, which is the one that is waited for. */
const FIRST_PAGE = { limit: 10, offset: 0 };

/**
 * Whether the settings screen has everything it needs to draw itself.
 *
 * The screen shows one loader and then its content, rather than a loader per
 * section: so every answer a section needs is asked for here, at the screen,
 * and the screen waits for all of them. The sections ask for the same answers
 * themselves, which the cache has by then, so nothing is fetched twice.
 *
 * The first page of each table is waited on too, so a section does not arrive
 * and then fill its own table in. Later pages are not: by then the reader has
 * the screen and is paging through it, which is the table's own business.
 *
 * @returns Whether the screen may draw, and nothing else.
 */
export function useSettingsReady() {
  const { selected, me } = useOrganization();

  const organizationId = selected?.id;
  const signedInUserId = getSignedInUserId();

  const user = useQuery(userOptions(signedInUserId ?? ''));
  const preference = useQuery(organizationPreferenceOptions(organizationId));
  const emailDomains = useQuery(organizationEmailDomainsOptions(organizationId));
  const cleanupPreference = useQuery(organizationCleanupPreferenceOptions(organizationId));
  const sso = useQuery(organizationSsoOptions(organizationId));
  const samlIdpMetadata = useQuery(samlIdpMetadataOptions(organizationId));
  const oidcProvider = useQuery(oidcProviderOptions(organizationId));

  /* The first page of the exports, which is the one the section opens on. */
  const archives = useQuery(organizationArchivesOptions(organizationId, FIRST_PAGE));

  /*
    The devices are only read where the organization allows them to be registered, which is
    also the only time that section is drawn.
  */
  const allowsDevices = Boolean(selected?.cyod_registration_enabled);

  const devices = useQuery({
    ...organizationRegisteredDevicesOptions(organizationId),
    enabled: organizationId !== undefined && allowsDevices,
  });

  /* Which sections are drawn turns on both of these, so nothing can be drawn without them. */
  if (selected === null || me === null) {
    return false;
  }

  const waitedOn = [
    user,
    preference,
    emailDomains,
    cleanupPreference,
    sso,
    samlIdpMetadata,
    oidcProvider,
    archives,
    ...(allowsDevices ? [devices] : []),
  ];

  return !waitedOn.some((answer) => answer.isPending);
}
