import type { ApiUserMfaMethod } from '@irene/api/services/user';

/** A method an account can set up: TOTP (an authenticator app) or HOTP (email). */
export type ApiMfaSetupMethod = Exclude<ApiUserMfaMethod, 0>;

/** One second-factor method, and whether it is the account's active one. */
export interface ApiMfa {
  method: ApiMfaSetupMethod;
  enabled: boolean;
}

/**
 * One step of enabling or switching a method.
 *
 * The first step names the method alone. Each later step adds the OTP the
 * previous step asked for, and the last adds the `token` a setup handed back.
 */
export interface ApiMfaEnableRequest {
  method: ApiMfaSetupMethod;
  otp?: string;
  token?: string;
}

/**
 * What a step that starts a setup hands back: the secret an authenticator app
 * is set up from, and a signed token naming it for the step that confirms.
 * For email, `secret` is a cache key rather than a TOTP secret.
 */
export interface ApiMfaSetupToken {
  secret: string;
  token: string;
}

/**
 * Disabling the active method. Without an OTP the server asks for one,
 * emailing it first when the method is email.
 */
export interface ApiMfaDisableRequest {
  method: ApiUserMfaMethod;
  otp?: string;
}
