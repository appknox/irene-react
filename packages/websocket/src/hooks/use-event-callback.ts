import { useCallback, useEffect, useRef } from 'react';

/**
 * Keeps one function for the life of a component, always calling the newest one.
 *
 * Callers write handlers inline, so a subscription keyed on the handler itself
 * would be rebuilt every render. This lets a page pass an arrow without
 * reopening a connection.
 *
 * @param callback - The newest handler, as the caller wrote it this render.
 * @returns A handler that does not change, which calls the newest one.
 */
export function useEventCallback<TArgs extends unknown[]>(callback: (...args: TArgs) => void) {
  const latest = useRef(callback);

  useEffect(() => {
    latest.current = callback;
  }, [callback]);

  return useCallback((...args: TArgs) => latest.current(...args), []);
}
