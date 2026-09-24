/** The languages the server serves the product in. */
export type ApiUserLanguage = 'en' | 'ja';

/** The second factor an account signs in with: none, TOTP, HOTP. */
export type ApiUserMfaMethod = 0 | 1 | 2;

/**
 * The account's fields, as the endpoint names them.
 *
 * The private half is only sent when the id asked for is the asking account's,
 * so those are declared optional.
 */
export interface ApiUserAttributes {
  uuid: string;
  username: string;
  'first-name': string;
  'last-name': string;
  lang: ApiUserLanguage;
  email?: string;
  'mfa-method'?: ApiUserMfaMethod;
  'is-trial'?: boolean;
  'can-disable-mfa'?: boolean;
  'freshchat-hash'?: string;
}

/** How the endpoint wraps the account: the id beside the attributes. */
export interface ApiUserResponse {
  data: {
    id: number;
    type: 'users';
    attributes: ApiUserAttributes;
  };
}

/**
 * The account signed in to this session, with the envelope taken off.
 *
 * Only the fields the app reads are declared. The endpoint returns more, and
 * adding one here is how it becomes available rather than a reason to widen
 * this to everything the server happens to send.
 */
export interface ApiUser {
  id: number;
  uuid: string;
  username: string;
  email: string | null;
  first_name: string;
  last_name: string;
  lang: ApiUserLanguage;
  is_trial: boolean;
  mfa_method: ApiUserMfaMethod | null;
  can_disable_mfa: boolean;
  freshchat_hash: string | null;
}
