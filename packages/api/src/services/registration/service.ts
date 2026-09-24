import { apiRequest } from '@irene/api/request';
import type { ApiSessionResponse } from '@irene/api/services/auth';

import type {
  ApiInvitedRegistration,
  ApiInvitedRegistrationRequest,
  ApiOrganizationInvitation,
  ApiOrganizationInvitationResponse,
  ApiRegistrationRequest,
} from '@irene/api/services/registration';

import { RegistrationEndpoints } from './endpoints';

/** Opens an account for someone who does not have one. */
export default class RegistrationService {
  /**
   * Registers an account. The backend answers 204 whether the address is new or
   * already registered, and emails the address either way, so nothing here
   * reveals who has an account.
   *
   * @param registration - The address, company, name and reCAPTCHA token.
   */
  public static readonly register = (registrationData: ApiRegistrationRequest) =>
    apiRequest.post<void>(RegistrationEndpoints.register(), registrationData);

  /**
   * Reads what an invitation knows about the person it was sent to.
   *
   * @param token - The signed invitation from the link.
   * @returns The address, company and name to open the form with.
   */
  public static readonly getInvitedRegistration = (token: string) =>
    apiRequest.get<ApiInvitedRegistration>(RegistrationEndpoints.invite(), { params: { token } });

  /**
   * Redeems an invitation, which opens the account and signs it in at once.
   *
   * @param registration - The invitation and the account to open with it.
   * @returns The token and user id to build a session from.
   */
  public static readonly registerViaInvite = (registration: ApiInvitedRegistrationRequest) =>
    apiRequest.post<ApiSessionResponse>(RegistrationEndpoints.invite(), registration);

  /**
   * Reads an organization's invitation. Answered 404 when the token is not a
   * uuid, names no invitation, or names one already redeemed, so a refusal
   * never says which.
   *
   * @param token - The invitation's uuid from the link.
   * @returns The address and organization to open the form with, and whether it takes a password.
   */
  public static readonly getOrganizationInvitation = (token: string) =>
    apiRequest.get<ApiOrganizationInvitation>(RegistrationEndpoints.organizationInvite(token));

  /**
   * Redeems an organization's invitation.
   *
   * Answered 204 and grants no session, so the account signs in afterwards
   * rather than arriving in the dashboard.
   *
   * @param request.token - The invitation's uuid from the link.
   * @param request.account - The account to open with it.
   */
  public static readonly acceptOrganizationInvitation = ({
    token,
    account,
  }: ApiOrganizationInvitationResponse) =>
    apiRequest.post<void>(RegistrationEndpoints.organizationInvite(token), account);
}
