import { useCallback, useEffect, useState } from 'react';

const COLLAPSED = 'collapsed';
const EXPANDED = 'expanded';

/*
  What the navigation is wide at each width, which the chat widget is placed
  against. In pixels: the widths come from the spacing scale, which counts in
  4px steps, while rem would count against the 14px root and fall short.
*/
const SIDE_NAV_WIDTH = { collapsed: '56px', expanded: '250px' };

/**
 * Whether a product's navigation is collapsed, remembered per product.
 *
 * Each layout passes its own storage key, so collapsing the dashboard's
 * navigation does not collapse reporting's.
 *
 * It also writes the current width to `--ak-chat-left` on the document root.
 * The Freshchat widget mounts on the body, outside the React tree, and is
 * placed against that property by packages/ui/styles/freshchat.css.
 *
 * @param storageKey - Where this product's choice is stored.
 * @returns Whether the navigation is collapsed, and a toggle for it.
 */
export function useSidebarState(storageKey: string) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = window.localStorage.getItem(storageKey);

    /* Collapsed until the user says otherwise, so a first visit gives the page its width. */
    return stored === null ? true : stored === COLLAPSED;
  });

  // Toggles the sidebar state
  const toggle = useCallback(() => {
    setIsCollapsed((collapsed) => {
      const next = !collapsed;
      window.localStorage.setItem(storageKey, next ? COLLAPSED : EXPANDED);

      return next;
    });
  }, [storageKey]);

  // Adjusts the position of the freshchat widget based on the sidebar state.
  useEffect(() => {
    const width = isCollapsed ? SIDE_NAV_WIDTH.collapsed : SIDE_NAV_WIDTH.expanded;
    document.documentElement.style.setProperty('--ak-chat-left', width);

    return () => {
      document.documentElement.style.removeProperty('--ak-chat-left');
    };
  }, [isCollapsed]);

  return { isCollapsed, toggle };
}
