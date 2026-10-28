import { ProjectsPage } from './projects-page';

/*
  The screens the React side draws.

  The ledger for the migration: a screen is listed here and the host renders it
  by name, so moving one touches nothing else on the host.
*/
export const REACT_SCREENS = {
  ProjectsPage,
} as const;

export type ReactScreenName = keyof typeof REACT_SCREENS;
