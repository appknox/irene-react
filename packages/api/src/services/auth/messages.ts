/**
 * The exact messages the login endpoint answers a refusal with. Matched by
 * value, so a change on the server has to be mirrored here.
 */
export const API_LOGIN_REFUSAL_MESSAGES = {
  CREDENTIALS_REJECTED: 'Unable to log in with provided credentials.',
  ACCOUNT_LOCKED: 'Account Locked Out',
} as const;
