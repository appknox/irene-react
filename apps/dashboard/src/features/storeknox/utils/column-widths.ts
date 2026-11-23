/* ember-table's width for a column that names none. */
const EMBER_TABLE_DEFAULT_WIDTH = 100;

/**
 * irene's px column widths as CSS percentages of the row; irene's fixed-layout
 * tables spread the spare width in proportion, so the px values act as ratios.
 *
 * @param widths - irene's widths in px; `undefined` for a column with none.
 */
export function ireneColumnShares(widths: Array<number | undefined>) {
  const resolved = widths.map((width) => width ?? EMBER_TABLE_DEFAULT_WIDTH);
  const total = resolved.reduce((sum, width) => sum + width, 0);

  return resolved.map((width) => `${((width / total) * 100).toFixed(2)}%`);
}

/* The app list's store column in irene: 80 of a 780 row. */
const STORE_SHARE = 80 / 780;

/**
 * Shares for a table led by the store column, which keeps the inventory's share
 * on every tab so it does not shift as the tabs switch, unlike irene's.
 *
 * @param widths - irene's widths in px for the columns after the store; `undefined` for a column with none.
 */
export function skStoreTableColumnShares(widths: Array<number | undefined>) {
  const resolved = widths.map((width) => width ?? EMBER_TABLE_DEFAULT_WIDTH);
  const total = resolved.reduce((sum, width) => sum + width, 0);
  const shares = [STORE_SHARE, ...resolved.map((width) => (width / total) * (1 - STORE_SHARE))];

  return shares.map((share) => `${(share * 100).toFixed(2)}%`);
}
