/**
 * Why an OIDC token was refused.
 *
 * @interface ApiOidcError
 * @property {string} code - The OAuth error code, e.g. `invalid_oidc_token`, `access_denied`.
 * @property {string} description - The wording to show, which is empty for some codes.
 */
export interface ApiOidcError {
  code: string;
  description: string;
}

/**
 * What the API makes of an OIDC token.
 *
 * `redirect_url` is where the browser goes next: the client's callback with a
 * code on success, or the same callback with an error on refusal. It is null
 * when the failure belongs to no client, and the app shows it instead.
 *
 * @interface ApiOidcValidationResult
 * @property {boolean} valid - Whether the token and its credentials passed.
 * @property {string | null} redirect_url - Where to send the browser, when there is anywhere to send it.
 * @property {ApiOidcError | null} error - Why it was refused.
 */
export interface ApiOidcValidationResult {
  valid: boolean;
  redirect_url: string | null;
  error: ApiOidcError | null;
}

/**
 * What the client is asking the account to agree to.
 *
 * @interface ApiOidcAuthorizationForm
 * @property {string} application_name - The client's own name.
 * @property {string[]} scopes_descriptions - One line per scope, already worded for a reader.
 * @property {boolean} authorization_needed - False when the client is trusted or the scopes were granted before, in which case nothing is asked.
 */
export interface ApiOidcAuthorizationForm {
  application_name: string;
  scopes_descriptions: string[];
  authorization_needed: boolean;
}

/**
 * The authorization request, and what the API made of its token.
 *
 * @interface ApiOidcAuthorization
 * @property {ApiOidcAuthorizationForm | null} form_data - What to ask for, or null when the token was refused.
 * @property {ApiOidcValidationResult} validation_result - Whether the token passed.
 */
export interface ApiOidcAuthorization {
  form_data: ApiOidcAuthorizationForm | null;
  validation_result: ApiOidcValidationResult;
}
