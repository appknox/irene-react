import type { ApiSkApp } from '@irene/api/services/storeknox';

/** One row of a StoreKnox app table; a row with no app is a loading placeholder. */
export interface SkAppTableRow {
  app?: ApiSkApp;
}

/** The placeholder rows a table shows while its page loads. */
export const buildSkLoadingRows = (count: number): SkAppTableRow[] =>
  Array.from({ length: count }, () => ({}));
