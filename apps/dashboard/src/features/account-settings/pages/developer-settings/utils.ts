import type { ApiJsonApiError, ApiJsonApiErrorResponse } from '@irene/api/services/personal-token';
import { getApiErrorPayload } from '@irene/api/utils/errors';

/**
 * The first complaint in a JSON:API refusal, which is the one irene reads.
 *
 * @param error - Whatever the request rejected with.
 * @returns The complaint, or undefined when the body holds none.
 */
export const getFirstJsonApiError = (error: unknown): ApiJsonApiError | undefined =>
  getApiErrorPayload<ApiJsonApiErrorResponse>(error)?.errors?.[0];
