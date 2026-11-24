import { useEffect, useState } from 'react';

/**
 * A value as it stands once it has stopped changing.
 *
 * Typing in a search field changes the value on every keystroke; this settles
 * it, so the list is asked for once the typing stops rather than letter by
 * letter.
 *
 * @param value - The value as it changes.
 * @param delayMs - How long it has to hold still.
 * @returns The value as it last settled.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return settled;
}
