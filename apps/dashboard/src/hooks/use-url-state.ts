import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useCallback } from 'react';

/** What a screen may keep in the address: a count, a flag, or what was typed. */
type UrlValue = string | number | boolean;

/**
 * Reads the named parameters out of a location's search, falling back to the
 * defaults. The search is whatever the address held, so a value may arrive as
 * the text it was written as rather than the type it stands for.
 */
function readState<T extends Record<string, UrlValue>>(
  defaults: T,
  search: Record<string, unknown>
): T {
  const state = { ...defaults };

  for (const key of Object.keys(defaults)) {
    const raw = search[key];

    if (raw === undefined || raw === null) {
      continue;
    }

    const fallback = defaults[key];

    if (typeof fallback === 'number') {
      const value = Number(raw);

      state[key as keyof T] = (
        Number.isFinite(value) && value >= 0 ? value : fallback
      ) as T[keyof T];
    } else if (typeof fallback === 'boolean') {
      state[key as keyof T] = (raw === true || raw === 'true') as T[keyof T];
    } else {
      state[key as keyof T] = String(raw) as T[keyof T];
    }
  }

  return state;
}

/**
 * Keeps a screen's state in the address, as irene keeps it in route query
 * parameters.
 *
 * The address is the state, so a reload opens the screen as it was left and a
 * link into it can carry that state — a list filtered to one team, say.
 *
 * It goes through the router, so such a link navigates in place rather than
 * loading the document again. Inside the other app the router is this screen's
 * own, in memory, and the screen mirrors it into the address bar.
 *
 * Replaced rather than pushed, so narrowing a list adds no history entries and
 * Back leaves the screen rather than walking its pages. Parameters it was not
 * given are left alone, so two lists on one screen each keep their own state.
 *
 * @param defaults - The parameters to read, and what each is where the address names it not. Written outside the component, since its keys decide what is read.
 * @returns The state the address names, and a function to change part of it.
 */
export function useUrlState<T extends Record<string, UrlValue>>(defaults: T) {
  const navigate = useNavigate();

  const search = useRouterState({
    select: (state) => state.location.search as Record<string, unknown>,
  });

  const changeState = useCallback(
    (next: Partial<T>) => {
      void navigate({
        to: '.',
        search: (current: Record<string, unknown>) => ({ ...current, ...next }),
        replace: true,
      });
    },
    [navigate]
  );

  return [readState(defaults, search), changeState] as const;
}
