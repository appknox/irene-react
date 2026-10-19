import { apiRequest, REQUEST_ABORT_TIMEOUT_MS } from '@irene/api/request';
import { transformPaginatedResponse } from '@irene/api/utils/transforms';
import type { ApiPageEnvelope } from '@irene/api/utils/pagination';

import type {
  ApiMfa,
  ApiMfaDisableRequest,
  ApiMfaEnableRequest,
  ApiMfaSetupToken,
} from '@irene/api/services/mfa';

import { MfaEndpoints } from './endpoints';

/**
 * Talks to the endpoint that sets up the signed-in account's second factor.
 *
 * Every step of enabling, switching and disabling is a request to the one
 * endpoint. A step that needs an OTP the request did not carry is refused with
 * a 400 whose `otp` field says so, and for email that refusal is what sends
 * the code: callers read that refusal as "now ask for the code", not as a failure.
 */
export default class MfaService {
  /**
   * Fetches both methods and which one is active.
   *
   * @returns The methods, the authenticator app first.
   */
  public static readonly getMfaMethods = async () => {
    const page = await apiRequest.get<ApiPageEnvelope<ApiMfa>>(MfaEndpoints.mfa(), {
      signal: AbortSignal.timeout(REQUEST_ABORT_TIMEOUT_MS),
    });

    return transformPaginatedResponse(page).items;
  };

  /**
   * Takes a step of enabling a method, or of switching to it, that hands back a
   * setup token: the first step of a setup, or the step of a switch that proves
   * the current factor.
   *
   * @param request - The method, plus the OTP the step needs.
   * @returns The secret and the signed token the confirming step carries.
   */
  public static readonly requestMfaSetup = (request: ApiMfaEnableRequest) =>
    apiRequest.post<ApiMfaSetupToken>(MfaEndpoints.mfa(), request);

  /**
   * Takes the last step of enabling a method, or of switching to it: the code
   * from the new factor, with the token its setup handed back.
   *
   * @param request - The method, the OTP and the setup token.
   * @returns Resolves once the method is active.
   */
  public static readonly confirmMfa = (request: Required<ApiMfaEnableRequest>) =>
    apiRequest.post<void>(MfaEndpoints.mfa(), request);

  /**
   * Takes one step of disabling the active method.
   *
   * @param request - The active method, plus the OTP once there is one.
   * @returns Resolves once the method is off.
   */
  public static readonly disableMfa = (request: ApiMfaDisableRequest) =>
    apiRequest.delete<void>(MfaEndpoints.mfa(), request);
}
