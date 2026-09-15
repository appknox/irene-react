import { isAxiosError } from 'axios';

/** Per-field messages from a DRF 400, keyed by field name. */
export type ApiFieldErrors = Record<string, string[]>;

const NON_FIELD = 'non_field_errors';

/**
 * Normalises one DRF error value into a list of messages.
 *
 * @param value - A message string, a list of messages, or anything else.
 * @returns The messages, or an empty list when the value holds none.
 */
const _asMessages = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  return typeof value === 'string' ? [value] : [];
};

/**
 * Parses a DRF error body into per-field messages. Form-wide messages under `detail` move to `non_field_errors`.
 *
 * @param payload - The response body, e.g. `{ username: ['Already taken'] }`.
 * @returns Messages keyed by field, or an empty object when the body is not a DRF error.
 */
export function parseApiFieldErrors(payload: unknown) {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
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
 * Picks the first message to show from parsed field errors.
 *
 * @param errors - The output of `parseApiFieldErrors`.
 * @returns The first message, or undefined when there is none.
 */
export function getFirstApiErrorMessage(errors: ApiFieldErrors) {
  return Object.values(errors).flat()[0];
}

const UNKNOWN_ERROR_MESSAGE = 'Something went wrong';

/**
 * Turns a failed request into a message to show the user.
 *
 * @param error - Whatever the request rejected with.
 * @returns The API's own message, else the error's message, else a generic one.
 */
export function getApiErrorMessage(error: unknown) {
  if (typeof error === 'string') {
    return error;
  }

  if (!isAxiosError(error)) {
    return error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
  }

  return getFirstApiErrorMessage(parseApiFieldErrors(error.response?.data)) ?? error.message;
}
