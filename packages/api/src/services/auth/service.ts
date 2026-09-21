import { apiRequest } from '@irene/api/request';

import {
  AuthEndpoints,
  type ApiLoginRequest,
  type ApiOidcCallbackRequest,
  type ApiOidcCallbackResponse,
  type ApiOidcStartRequest,
  type ApiResetPasswordRequest,
  type ApiResetTokenResponse,
  type ApiSamlStartRequest,
  type ApiSessionResponse,
  type ApiSsoCheck,
  type ApiSsoRedirect,
} from '@irene/api/services/auth';

/**
 * The AuthService is a singleton that provides methods to interact with the auth endpoints.
 * It is used to check if the user is authenticated, sign in, sign out, recover a password,
 * verify a reset token, reset a password, check if SSO is available, start a SAML login,
 * login with a SAML token, start an OIDC login, and complete an OIDC login.
 */
export default class AuthService {
  /**
   * Checks that the stored credential is still live. The client attaches it.
   * @returns Resolves on a 2xx; rejects with the `AxiosError` otherwise, 401 meaning refused.
   */
  public static readonly checkSession = () => apiRequest.post(AuthEndpoints.check(), {});

  /**
   * Signs a user in with a username or email and password.
   * Sends the username lowercased because the server compares it case-insensitively.
   * @param credentials - The username or email, and the password.
   * @returns The token and user id to build a session from.
   */
  public static readonly login = (data: ApiLoginRequest) => {
    const { username, password, otp } = data;
    const otpParam = otp ? { otp } : {};

    return apiRequest.post<ApiSessionResponse>(AuthEndpoints.login(), {
      username: username.toLowerCase(),
      password,
      ...otpParam,
    });
  };

  /**
   * Ends the session server-side. The caller still forgets the stored credential itself,
   * since a failed request must not leave the user signed in.
   * @returns Resolves once the server has released the session.
   */
  public static readonly logout = () => apiRequest.post(AuthEndpoints.logout(), {});

  /**
   * Asks for a password reset link. Runs signed out, so it carries no credential.
   * @param username - The username or email to send the link to.
   * @returns Resolves once the request is accepted.
   */
  public static readonly recoverPassword = (username: string) =>
    apiRequest.post(AuthEndpoints.recover(), { username });

  /**
   * Checks that a reset link is still usable, before asking for a new password.
   * @param token - The token from the emailed link.
   * @returns The account the link belongs to; rejects when the link is spent or unknown.
   */
  public static readonly verifyResetToken = (token: string) =>
    apiRequest.get<ApiResetTokenResponse>(AuthEndpoints.resetPassword(token));

  /**
   * Sets a new password against a reset link.
   * @param request - The link's token, and the new password twice.
   * @returns Resolves once the password is changed.
   */
  public static readonly resetPassword = (data: ApiResetPasswordRequest) => {
    const { token, password, confirmPassword } = data;

    return apiRequest.put(AuthEndpoints.resetPassword(token), {
      password,
      confirm_password: confirmPassword,
    });
  };

  /**
   * Asks how a user signs in. Runs before the user has any credential.
   * @param username - The username or email the user typed.
   * @returns Whether SAML or OIDC is available, whether SSO is enforced, and the token for the SSO redirect.
   */
  public static readonly checkSso = (username: string) =>
    apiRequest.post<ApiSsoCheck>(AuthEndpoints.ssoCheck(), { username });

  /**
   * Asks where to send a SAML user. The browser then leaves this app for that URL.
   * @param request - The check's token, and the URL the provider returns the user to.
   * @returns The identity provider's URL.
   */
  public static readonly startSaml = ({ token, returnTo }: ApiSamlStartRequest) =>
    apiRequest.get<ApiSsoRedirect>(AuthEndpoints.samlStart(), {
      params: { token, return_to: returnTo },
    });

  /**
   * Trades the token SAML sent the user back with for a session.
   * @param ssoToken - The token from the provider's redirect.
   * @returns The token and user id to build a session from.
   */
  public static readonly loginWithSaml = (ssoToken: string) =>
    apiRequest.post<ApiSessionResponse>(AuthEndpoints.samlLogin(), { token: ssoToken });

  /**
   * Asks where to send an OIDC user. The browser then leaves this app for that URL.
   * @param request - The username, and the URL the provider returns the user to.
   * @returns The identity provider's URL, and which provider it is.
   */
  public static readonly startOidc = ({ username, redirectUri }: ApiOidcStartRequest) =>
    apiRequest.post<ApiSsoRedirect>(AuthEndpoints.oidcStart(), {
      username,
      redirect_uri: redirectUri,
    });

  /**
   * Exchanges the code OIDC sent the user back with for a session.
   * The code is single use, so this runs once per redirect.
   * @param request - The code and state from the provider's redirect.
   * @returns The signed-in user, and the token to build a session from.
   */
  public static readonly completeOidcLogin = ({ code, state }: ApiOidcCallbackRequest) =>
    apiRequest.post<ApiOidcCallbackResponse>(AuthEndpoints.oidcCallback(), { code, state });
}
