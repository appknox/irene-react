import { AxiosError, isAxiosError } from 'axios';
import { HTTP_STATUS_CODES } from '@irene/constants';

/** Per-field messages from a DRF error body, keyed by field name. */
export type ApiFieldErrors<TFields extends string = string> = Partial<Record<TFields, string[]>>;

/** DRF puts a form-wide complaint under `detail`; it is filed here instead. */
const NON_FIELD = 'non_field_errors';

/**
 * The codes axios rejects with when a request is given up on rather than
 * answered: its own `timeout` elapsing, and an `AbortSignal` firing.
 */
const ABORTED_REQUEST_CODES = new Set([AxiosError.ECONNABORTED, AxiosError.ERR_CANCELED]);

/**
 * Normalises one DRF error value into a list of messages.
 *
 * @param value - A message string, a list of messages, or anything else.
 * @returns The messages, or an empty list when the value holds none.
 */
function _asMessages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  return typeof value === 'string' ? [value] : [];
}

/**
 * Parses a body into per-field messages. A top-level array is a form-wide
 * complaint, so it is filed under `non_field_errors`.
 *
 * A body that is one bare string is ignored: that is what a server returns when
 * it hands back an HTML error page, and no user should be shown that.
 *
 * @param payload - The response body.
 * @returns Messages keyed by field.
 */
function _parseFieldErrors(payload: unknown): ApiFieldErrors {
  if (Array.isArray(payload)) {
    const formWide = _asMessages(payload);

    return formWide.length > 0 ? { [NON_FIELD]: formWide } : {};
  }

  if (payload === null || typeof payload !== 'object') {
    return {};
  }

  const errors: ApiFieldErrors = {};

  for (const [key, value] of Object.entries(payload)) {
    const messages = _asMessages(value);

    if (messages.length > 0) {
      errors[key === 'detail' ? NON_FIELD : key] = messages;
    }
  }

  return errors;
}

/**
 * Whether the request never reached the server, so there is no response to read.
 *
 * @param error - Whatever the request rejected with.
 * @returns Whether the failure was the network rather than the server.
 */
export function isNetworkError(error: unknown): boolean {
  return isAxiosError(error) && !error.response;
}

/**
 * Whether the request was abandoned before the server answered.
 *
 * Reads as a network failure like any other, so it is told apart by its code:
 * the request was given up on, not refused, and sending it again would wait out
 * the same timeout.
 *
 * @param error - Whatever the request rejected with.
 * @returns Whether the request was abandoned.
 */
export function isAbortedRequest(error: unknown): boolean {
  return isAxiosError(error) && ABORTED_REQUEST_CODES.has(error.code ?? '');
}

/**
 * Reads the HTTP status off a failed request.
 *
 * @param error - Whatever the request rejected with.
 * @returns The status, or undefined when the request never reached the server.
 */
export function getApiErrorStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.status : undefined;
}

/**
 * Reads the per-field messages off a failed request, so a form can put each
 * complaint on the field it belongs to.
 *
 * @param error - Whatever the request rejected with.
 * @returns Messages keyed by field, or an empty object when the body holds none.
 * @example
 * const errors = getApiFieldErrors<'username' | 'password'>(error);
 * form.setError('username', { message: errors.username?.[0] });
 */
export function getApiFieldErrors<TFields extends string = string>(
  error: unknown
): ApiFieldErrors<TFields> {
  return _parseFieldErrors(getApiErrorPayload(error)) as ApiFieldErrors<TFields>;
}

/**
 * Turns a failed request into the one message worth showing.
 *
 * Returns nothing when the body explains nothing, so the caller picks its own
 * wording rather than showing axios's own text to a user.
 *
 * @param error - Whatever the request rejected with, or nothing when it succeeded.
 * @returns The server's own message, or undefined when it did not give one.
 */
export function getApiErrorMessage(error: unknown): string | undefined {
  if (error === null || error === undefined) {
    return undefined;
  }

  if (typeof error === 'string') {
    return error;
  }

  return Object.values(getApiFieldErrors(error)).flat()[0];
}

/**
 * Reads the response body off a failed request.
 *
 * Use it for bodies that are not complaints — the MFA challenge, or the
 * `lock_time` a 429 carries — which the other two would flatten into text.
 *
 * @param error - Whatever the request rejected with.
 * @returns The body, or undefined when the request never reached the server.
 * @example
 * const challenge = getApiErrorPayload<ApiMfaRequirement>(error);
 */
export function getApiErrorPayload<TPayload = unknown>(error: unknown): TPayload | undefined {
  return isAxiosError<TPayload>(error) ? error.response?.data : undefined;
}

/**
 * Whether the request was refused because the account is rate limited.
 *
 * A caller should stay quiet about these: the countdown already tells the user
 * what happened and how long it lasts, so a second message about the same
 * refusal only contradicts it.
 *
 * @param error - The rejection.
 * @returns Whether the server answered 429.
 */
export const isRateLimited = (error: unknown) =>
  getApiErrorStatus(error) === HTTP_STATUS_CODES.TOO_MANY_REQUESTS;

/**
 * Wraps an error handler so it does nothing while the account is rate limited.
 *
 * The countdown already tells the user what happened and how long it lasts. A
 * handler that also notifies, resets a form or navigates would talk over it,
 * so the whole handler is skipped rather than only its message.
 *
 * @param handler - What to do about an error that is not a rate limit.
 * @returns The same handler, quiet for the one refusal already accounted for.
 *
 * @example
 * onError: unlessRateLimited(() => akNotify.error(akMT('pleaseTryAgain')))
 */
export function unlessRateLimited<TArgs extends [unknown, ...unknown[]]>(
  handler: (...args: TArgs) => void
) {
  return (...args: TArgs) => {
    const [error] = args;

    if (!isRateLimited(error)) {
      handler(...args);
    }
  };
}
