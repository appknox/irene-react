import { useEffect } from 'react';

import { isRateLimited } from '@irene/api/utils/errors';
import { akNotify } from '@irene/ui/notify';
import { skErrorMessage } from '@/features/storeknox/utils/error-message';

/**
 * Raises a toast once each time a query fails; a rate-limited request is skipped since that notice is global.
 *
 * @param message - The fixed message irene shows; the server's own when absent.
 */
export function useErrorToast(error: unknown, message?: string) {
  useEffect(() => {
    if (error && !isRateLimited(error)) {
      akNotify.error(message ?? skErrorMessage(error));
    }
  }, [error, message]);
}
