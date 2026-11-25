import { useEffect, useRef, useState } from 'react';

/** How long the copy control reads as copied before going back, as irene holds it. */
const COPIED_FEEDBACK_MS = 2000;

/**
 * Copies text to the clipboard and reports whether it landed.
 *
 * @returns Whether the last copy landed, and the way to copy.
 */
export function useCopyFeedback() {
  const [hasCopied, setHasCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    []
  );

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);

      setHasCopied(true);

      if (timer.current) {
        clearTimeout(timer.current);
      }

      timer.current = setTimeout(() => setHasCopied(false), COPIED_FEEDBACK_MS);

      return true;
    } catch {
      return false;
    }
  };

  return { hasCopied, copy };
}
