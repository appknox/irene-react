/** The page a paginated list asks for: how many rows, and how many to skip. */
export interface AkPaginationPage {
  limit: number;
  offset: number;
}

/** irene's options when a list passes none of its own. */
export const AK_PAGINATION_DEFAULT_OPTIONS = [5, 10, 20, 30, 40];

interface AkPaginationInput {
  totalItems: number;
  limit: number;
  offset: number;
  itemPerPageOptions?: number[];
}

/**
 * Works out the pagination bar's range and which directions are open. A limit not
 * in the options falls back to the first option, and an offset past the last row
 * moves to the last page so a stale URL never shows "13-12 of 12", unlike irene.
 */
export function getAkPaginationState({
  totalItems,
  limit,
  offset,
  itemPerPageOptions = AK_PAGINATION_DEFAULT_OPTIONS,
}: AkPaginationInput) {
  const options =
    itemPerPageOptions.length > 0 ? itemPerPageOptions : AK_PAGINATION_DEFAULT_OPTIONS;

  const total = totalItems || 0;
  const pageSize = options.includes(limit) ? limit : options[0];
  const lastPageStart = Math.max(0, (Math.ceil(total / pageSize) - 1) * pageSize);
  const start = total > 0 && offset >= total ? lastPageStart : Math.min(Math.max(0, offset), total);

  return {
    options,
    limit: pageSize,
    offset: start,
    startItemIdx: start + 1,
    endItemIdx: Math.min(start + pageSize, total),
    disablePrev: start === 0,
    disableNext: start + pageSize >= total,
  };
}
