import { API_LOGIN_REFUSAL_MESSAGES, type ApiMfaRequirement } from '@irene/api/services/auth';
import { getApiErrorMessage, getApiErrorPayload, isNetworkError } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';

/**
 * How a refused sign-in is shown. `credentials` and `locked` belong under the
 * field; `mfa` moves the flow on to a second factor rather than reporting
 * anything; `notify` is raised as a toast.
 */

export enum LoginFailureKind {
  CREDENTIALS = 'credentials',
  LOCKED = 'locked',
  MFA = 'mfa',
  NOTIFY = 'notify',
}

export type LoginFailure =
  | { kind: LoginFailureKind.CREDENTIALS }
  | { kind: LoginFailureKind.LOCKED }
  | { kind: LoginFailureKind.MFA; mfaRequirement: ApiMfaRequirement }
  | { kind: LoginFailureKind.NOTIFY; message: string };

/**
 * Reads the second factor an account requires off a refusal. The server answers a
 * password-only attempt this way when the account has 2FA on, so it is a step
 * forward rather than something the user has to fix.
 *
 * @param payload - The response body.
 * @returns What the account requires, or undefined when the body carries none.
 */
function _readMfaRequirement(payload: unknown): ApiMfaRequirement | undefined {
  if (typeof payload !== 'object' || payload === null || !('type' in payload)) {
    return undefined;
  }

  const { type, forced } = payload as ApiMfaRequirement;

  if (type !== 'HOTP' && type !== 'TOTP') {
    return undefined;
  }

  // Anything else leaves the factor optional, so the flag is dropped.
  return forced === 'True' ? { type, forced: 'True' } : { type };
}

/**
 * Sorts a failed sign-in into what the page should do about it.
 *
 * @param error - The login mutation's error, or nothing when it has not failed.
 * @returns The failure to show, or undefined when there is none.
 */
export function getLoginFailure(error: unknown): LoginFailure | undefined {
  if (error === null || error === undefined) {
    return undefined;
  }

  // No response at all means the request never reached the server.
  if (isNetworkError(error)) {
    return { kind: LoginFailureKind.NOTIFY, message: akMT('networkError') };
  }

  const payload = getApiErrorPayload(error);

  // Checked before any message, since the body states a requirement, not a fault.
  const requiresMfa = _readMfaRequirement(payload);

  if (requiresMfa) {
    return { kind: LoginFailureKind.MFA, mfaRequirement: requiresMfa };
  }

  // Check messages for specific login failures.
  const message = getApiErrorMessage(error);

  if (message === API_LOGIN_REFUSAL_MESSAGES.CREDENTIALS_REJECTED) {
    return { kind: LoginFailureKind.CREDENTIALS };
  }

  if (message === API_LOGIN_REFUSAL_MESSAGES.ACCOUNT_LOCKED) {
    return { kind: LoginFailureKind.LOCKED };
  }

  // Without a message from the server there is nothing specific to say.
  return {
    kind: LoginFailureKind.NOTIFY,
    message: message ?? akMT('pleaseEnterValidAccountDetail'),
  };
}

/**
 * Whether the failure is a locked account or rejected credentials, the two the
 * user sees on the field rather than in a toast.
 *
 * @param failure - The refusal, if there is one.
 * @returns Whether it is one of those two.
 */
export const isLockedOrCredentialsFailure = (failure?: LoginFailure) =>
  failure?.kind === LoginFailureKind.LOCKED || failure?.kind === LoginFailureKind.CREDENTIALS;
