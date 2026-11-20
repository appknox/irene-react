import { getApiErrorMessage } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';

/** The server's message for a failed request, or `fallback` when it sent none, as irene's `parseError`. */
export const skErrorMessage = (error: unknown, fallback = akMT('somethingWentWrong')) =>
  getApiErrorMessage(error) ?? fallback;
