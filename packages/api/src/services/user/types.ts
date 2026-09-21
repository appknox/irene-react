/**
 * The account signed in to this session.
 *
 * Only the fields the app reads are declared. The endpoint returns more, and
 * adding one here is how it becomes available rather than a reason to widen
 * this to everything the server happens to send.
 */
export interface ApiUser {
  id: number;
  uuid: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  lang: string;
  is_trial: boolean;
  mfa_method: number | null;
  can_disable_mfa: boolean;
  freshchat_hash: string;
}
