/**
 * ============================================================
 * SESSION TYPES
 * ============================================================
 */

/* Response schema from the session endpoint.*/
export interface ApiSessionResponse {
  token: string;
  user_id: number;
}

/**
 * ============================================================
 * LOGIN TYPES
 * ============================================================
 */

/* Request schema from the login endpoint.*/
export interface ApiLoginRequest {
  username: string;
  password: string;
  otp?: string;
}

/* The type of MFA the account uses.*/
export type ApiMfaType = 'HOTP' | 'TOTP';

/**
 * Response interface from the MFA endpoint.
 *
 * Every value in a refusal body arrives as text, `forced` included, which reads
 * `'True'`. `email` names where an emailed code was sent.
 */
export interface ApiMfaRequirement {
  type: ApiMfaType;
  email?: string;
  forced?: string;
}

/**
 * ============================================================
 * PASSWORD RESET TYPES
 * ============================================================
 */

/** What checking a reset link returns: the account the link belongs to. */
export interface ApiResetTokenResponse {
  username: string;
}

/* Request shape for the reset password endpoint.*/
export interface ApiResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

/**
 * ============================================================
 * SSO TYPES
 * ============================================================
 */

/* Response shape from the SSO check endpoint.*/
export interface ApiSsoCheck {
  is_saml: boolean;
  is_sso_enforced: boolean;
  is_oidc: boolean;
  token: string;
}

/* Response shape from the SSO start endpoint.*/
export interface ApiSsoRedirect {
  url?: string;
  provider?: string;
}

/* Request shape to the SAML start endpoint.*/
export interface ApiSamlStartRequest {
  token: string;
  returnTo: string;
}

/* Request shape to the OIDC start endpoint.*/
export interface ApiOidcStartRequest {
  username: string;
  redirectUri: string;
}

/* Request shape to the OIDC callback endpoint.*/
export interface ApiOidcCallbackRequest {
  code: string;
  state?: string;
}

/* Response shape from the OIDC callback endpoint.*/
export interface ApiOidcCallbackResponse {
  success: boolean;
  token: string;
  user: ApiOidcCallbackUser;
}

interface ApiOidcCallbackUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}
