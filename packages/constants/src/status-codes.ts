/**
 * The HTTP statuses the API answers with, named so a call site reads as an
 * intent rather than a number.
 *
 * Descriptions are the API's own. Hover a member to read what it means.
 */
export const HTTP_STATUS_CODES = {
  /** The request was successful and the body holds the representation requested. */
  OK: 200,

  /** The request succeeded, the resource was updated, and the body holds the representation. */
  CREATED: 201,

  /** The request was accepted for further processing, completed sometime later. */
  ACCEPTED: 202,

  /** The request was successful and the resource was deleted. */
  NO_CONTENT: 204,

  /** A redirect: the representation is at the URI in the Location header. */
  FOUND: 302,

  /** There is no new data to return. */
  NOT_MODIFIED: 304,

  /**
   * The request was invalid or cannot otherwise be served, with a message
   * explaining why. A request without authentication counts as invalid.
   */
  BAD_REQUEST: 400,

  /** The credentials are missing, invalid, or insufficient for the resource. */
  UNAUTHORIZED: 401,

  /** The request was refused; the message says why, most often a rate limit. */
  FORBIDDEN: 403,

  /** The URI is invalid, or the resource does not exist. */
  NOT_FOUND: 404,

  /** The request asked for a format the endpoint cannot produce. */
  NOT_ACCEPTABLE: 406,

  /** The resource is gone: an endpoint that has been turned off. */
  GONE: 410,

  /** The application's rate limit for this resource is exhausted. */
  TOO_MANY_REQUESTS: 429,

  /** Something is horribly wrong. */
  INTERNAL_SERVER_ERROR: 500,

  /** The service is down or being upgraded. Try again later. */
  BAD_GATEWAY: 502,

  /** The service is up but overloaded. Try again later. */
  SERVICE_UNAVAILABLE: 503,

  /** The servers are up, but something in the stack failed. Try again later. */
  GATEWAY_TIMEOUT: 504,
} as const;

/** Any status the app names. */
export type HttpStatusCode = (typeof HTTP_STATUS_CODES)[keyof typeof HTTP_STATUS_CODES];
