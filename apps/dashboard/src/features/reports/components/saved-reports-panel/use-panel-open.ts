import { useCallback, useState } from 'react';

/** Where the panel's open or folded state is kept, so it stays the way the account left it. */
export const SAVED_REPORTS_PANEL_KEY = 'irene:saved-reports-panel';

/** Reads the stored state; open unless the account folded it away. */
const _readOpen = () => {
  try {
    return localStorage.getItem(SAVED_REPORTS_PANEL_KEY) !== 'closed';
  } catch {
    return true;
  }
};

/**
 * Whether the Saved reports panel is open, kept in browser storage.
 *
 * A browser that refuses storage still opens and folds the panel; it only
 * forgets the choice on the next visit.
 *
 * @returns The state and a setter that also stores it.
 */
export function usePanelOpen() {
  const [isOpen, setIsOpenState] = useState(_readOpen);

  const setIsOpen = useCallback((open: boolean) => {
    setIsOpenState(open);

    try {
      localStorage.setItem(SAVED_REPORTS_PANEL_KEY, open ? 'open' : 'closed');
    } catch {
      /* Storage refused: the choice lasts until the page is left. */
    }
  }, []);

  return [isOpen, setIsOpen] as const;
}
