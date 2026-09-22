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
