import {
  createColumnHelper,
  tableFeatures,
  type ColumnDef,
  type RowData,
} from '@tanstack/react-table';

/**
 * What a column may say about itself beyond its header and cells.
 *
 * @interface AkTableColumnMeta
 * @property {string} [width] - A CSS width for the column, e.g. `40%`. A table with any width set lays its columns out fixed, so the widths are honoured rather than treated as hints.
 */
export interface AkTableColumnMeta {
  width?: string;
}

/**
 * The core row model only, plus the column meta the design system reads. A
 * table that sorts, filters or paginates registers the feature it needs itself,
 * so no table pays for one it does not use.
 */
export const AK_TABLE_FEATURES = tableFeatures({ columnMeta: {} as AkTableColumnMeta });

/** The feature set every `AkTable` column is written against. */
export type AkTableFeatures = typeof AK_TABLE_FEATURES;

/** One column of an `AkTable`, as the column helper builds it. */
export type AkTableColumn<TData extends RowData, TValue = unknown> = ColumnDef<
  AkTableFeatures,
  TData,
  TValue
>;

/**
 * Builds the column helper for one row shape, already bound to `AkTable`'s
 * feature set. Apps describe columns through this rather than depending on
 * TanStack Table themselves.
 *
 * @returns The helper, whose `accessor` and `display` build the columns.
 */
export const createAkTableColumns = <TData extends RowData>() =>
  createColumnHelper<AkTableFeatures, TData>();
