/** A token as the endpoint sends it: a JSON:API resource. */
export interface ApiPersonalTokenResource {
  id: string;
  type: 'personaltokens';
  attributes: {
    key: string;
    name: string;
    created: string;
  };
}

/** The list as the endpoint sends it. */
export interface ApiPersonalTokenListResponse {
  data: ApiPersonalTokenResource[];
}

/** One generated token as the endpoint sends it. */
export interface ApiPersonalTokenResponse {
  data: ApiPersonalTokenResource;
}

/** A token the account can call the API with, with the envelope taken off. */
export interface ApiPersonalToken {
  id: string;
  name: string;
  key: string;
  /** When it was generated, as an ISO 8601 timestamp. */
  created: string;
}

/**
 * One complaint in a JSON:API error body. A name the account already uses is
 * refused with `code: 'unique'`.
 */
export interface ApiJsonApiError {
  code?: string;
  detail?: string;
}

/** A refusal from a JSON:API endpoint: a list of complaints rather than DRF's per-field object. */
export interface ApiJsonApiErrorResponse {
  errors?: ApiJsonApiError[];
}
