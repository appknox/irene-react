/**
 * What the registration endpoint is asked for.
 *
 * `recaptcha` carries the token the widget issued for the `registration`
 * action. A deployment with the check switched off accepts any value.
 *
 * @interface ApiRegistrationRequest
 * @property {string} email - Where the confirmation is sent.
 * @property {string} company - The organization the account is opened for.
 * @property {string} first_name - Given name, empty where the form does not ask for one.
 * @property {string} last_name - Family name, empty where the form does not ask for one.
 * @property {string} recaptcha - The token proving the request came from a person.
 */
export interface ApiRegistrationRequest {
  email: string;
  company: string;
  first_name: string;
  last_name: string;
  recaptcha: string;
}

/**
 * What an invitation already knows about the person it was sent to.
 *
 * The address is fixed by the invitation; the rest is what whoever raised it
 * filled in, and the form lets them correct it.
 *
 * @interface ApiInvitedRegistration
 * @property {string} email - The address the invitation was sent to.
 * @property {string} company - The organization it was raised for.
 * @property {string} first_name - Given name, empty where none was recorded.
 * @property {string} last_name - Family name, empty where none was recorded.
 */
export interface ApiInvitedRegistration {
  email: string;
  company: string;
  first_name: string;
  last_name: string;
}

/**
 * The account an invitation is redeemed for.
 *
 * The address is not here: it comes from the invitation and cannot be changed.
 *
 * @interface ApiInvitedRegistrationRequest
 * @property {string} token - The signed invitation from the link.
 * @property {string} username - The name the account signs in with.
 * @property {string} password - The password to set.
 * @property {string} confirm_password - The same password again.
 * @property {string} company - The organization the account belongs to.
 * @property {string} first_name - Given name.
 * @property {string} last_name - Family name.
 * @property {boolean} terms_accepted - Whether the terms were accepted, which the API requires.
 */
export interface ApiInvitedRegistrationRequest {
  token: string;
  username: string;
  password: string;
  confirm_password: string;
  company: string;
  first_name: string;
  last_name: string;
  terms_accepted: boolean;
}
