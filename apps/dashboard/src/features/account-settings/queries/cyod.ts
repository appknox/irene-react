import { queryOptions } from '@tanstack/react-query';
import { OrganizationService } from '@irene/api/services/organization';

/** The cache keys for an organization's CYOD devices. */
export const cyodKeys = {
  all: () => ['cyod'] as const,
  registeredDevices: (organizationId: number | string) =>
    [...cyodKeys.all(), 'registered-devices', organizationId] as const,
};

/**
 * Builds the query for the CYOD devices registered to an organization.
 *
 * A refusal is not retried: the common one is the 403 an organization without
 * its own device farm gets, which asking again will not change.
 *
 * @param organizationId - The organization to ask about.
 * @returns Query options resolving to the devices, online or not.
 */
export const registeredDevicesOptions = (organizationId: number | string) =>
  queryOptions({
    queryKey: cyodKeys.registeredDevices(organizationId),
    queryFn: () => OrganizationService.getRegisteredDevices(organizationId),
    retry: false,
  });
