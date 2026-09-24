import { queryOptions } from '@tanstack/react-query';
import { RegistrationService } from '@irene/api/services/registration';

/** Keys for what an invitation knows about the person it was sent to. */
export const registrationKeys = {
  all: () => ['registration'] as const,
  invite: (token: string) => [...registrationKeys.all(), 'invite', token] as const,

  organizationInvite: (token: string) =>
    [...registrationKeys.all(), 'organization-invite', token] as const,
};

/**
 * Builds the query that reads an invitation.
 *
 * Answered once per token: an invitation does not change while its page is
 * open, and redeeming it consumes it.
 *
 * @param token - The signed invitation from the link.
 * @returns Query options resolving to the address, company and name to open the form with.
 */
export const invitedRegistrationOptions = (token: string) =>
  queryOptions({
    queryKey: registrationKeys.invite(token),
    queryFn: () => RegistrationService.getInvitedRegistration(token),
    staleTime: Infinity,
    retry: false,
  });

/**
 * Builds the query that reads an organization's invitation.
 *
 * Not retried: the API answers 404 for a token that is malformed, unknown or
 * already redeemed, none of which a second attempt changes.
 *
 * @param token - The invitation's uuid from the link.
 * @returns Query options resolving to the address, organization and whether a password is asked for.
 */
export const organizationInvitationOptions = (token: string) =>
  queryOptions({
    queryKey: registrationKeys.organizationInvite(token),
    queryFn: () => RegistrationService.getOrganizationInvitation(token),
    staleTime: Infinity,
    retry: false,
  });
