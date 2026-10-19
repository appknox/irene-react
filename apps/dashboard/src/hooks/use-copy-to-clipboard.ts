import { useCallback, useEffect, useRef, useState } from 'react';

import { akMT } from '@irene/translations/intl';
import { akNotify } from '@irene/ui/notify';

/* How long `isCopied` stays true, which is how long a control can show it worked. */
const COPIED_RESET_DELAY = 2000;

interface CopyToClipboardOptions {
  successMessage?: string | null;
  errorMessage?: string | null;
  onCopied?: (text: string) => void;
  onFailed?: (error: unknown) => void;
}

/**
 * Puts text on the clipboard and reports whether it got there.
 *
 * The browser refuses the clipboard on an insecure origin or a denied
 * permission, so every copy can fail and the failure is told to the user.
 *
 * @param options.successMessage - Replaces the default notification; `null` drops it.
 * @param options.errorMessage - Replaces the default failure notification; `null` drops it.
 * @param options.onCopied - Runs after a successful copy, for anything beyond the notification.
 * @param options.onFailed - Runs after a failed copy, for anything beyond the notification.
 * @returns `copy`, and `isCopied` which is true for two seconds after a copy.
 */
export function useCopyToClipboard(options: Readonly<CopyToClipboardOptions> = {}) {
  const { successMessage, errorMessage, onCopied, onFailed } = options;

  const [isCopied, setIsCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);

        if (successMessage !== null) {
          akNotify.info(successMessage ?? akMT('copiedToClipboard'));
        }

        setIsCopied(true);
        clearTimeout(resetTimer.current);
        resetTimer.current = setTimeout(() => setIsCopied(false), COPIED_RESET_DELAY);

        onCopied?.(text);

        return true;
      } catch (error) {
        if (errorMessage !== null) {
          akNotify.error(errorMessage ?? akMT('pleaseTryAgain'));
        }

        onFailed?.(error);

        return false;
      }
    },
    [successMessage, errorMessage, onCopied, onFailed]
  );

  return { copy, isCopied };
}
