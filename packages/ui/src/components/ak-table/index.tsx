import { useTable, type RowData } from '@tanstack/react-table';
import { type VariantProps } from 'class-variance-authority';
import { type ComponentProps, type ReactNode } from 'react';

import { cn } from '@irene/ui/cn';

import { AK_TABLE_FEATURES, type AkTableColumn } from './helpers';
import { akTableVariants } from './variants';

type AkTableProps<TData extends RowData> = Omit<ComponentProps<'table'>, 'children'> &
  VariantProps<typeof akTableVariants> & {
    columns: Array<AkTableColumn<TData>>;
    data: TData[];
    caption?: ReactNode;
    emptyState?: ReactNode;
    getRowId?: (row: TData, index: number) => string;
    wrapperClassName?: string;
  };

/**
 * The design system's table, over TanStack Table's headless model.
 *
 * Columns carry their own header and cell rendering, so a caller describes the
 * table rather than writing its markup. The styling is variant-driven and the
 * element stays a real `<table>`, so a screen reader reads it as one.
 *
 * @param props.columns - What to show, one entry per column.
 * @param props.data - The rows, stable between renders so the model is not rebuilt.
 * @param props.variant - Which rules are drawn.
 * @param props.headerColor - Whether the header carries a fill.
 * @param props.borderColor - How strongly the rules are drawn.
 * @param props.hoverable - Tints a row under the pointer.
 * @param props.dense - Tightens the cells.
 * @param props.caption - Names the table for a screen reader, and on screen unless hidden.
 * @param props.emptyState - Shown in place of the body when there are no rows.
 * @param props.getRowId - Identifies a row, so React keeps its element across a reorder.
 * @param props.wrapperClassName - Classes for the element that scrolls.
 */
function AkTable<TData extends RowData>({
  columns,
  data,
  variant,
  headerColor,
  borderColor,
  hoverable,
  dense,
  caption,
  emptyState,
  getRowId,
  className,
  wrapperClassName,
  ...props
}: AkTableProps<TData>) {
  const table = useTable({ features: AK_TABLE_FEATURES, columns, data, getRowId });
  const rows = table.getRowModel().rows;
  const leafColumns = table.getAllLeafColumns();

  /* A table that sets any width lays out fixed, so every width is honoured exactly. */
  const hasColumnWidths = leafColumns.some((column) => column.columnDef.meta?.width);

  return (
    <div className={cn('w-full overflow-x-auto', wrapperClassName)}>
      <table
        data-slot="table"
        data-variant={variant ?? 'semi-bordered'}
        className={cn(
          akTableVariants({ variant, headerColor, borderColor, hoverable, dense }),
          hasColumnWidths && 'table-fixed',
          className
        )}
        {...props}
      >
        {caption && <caption className="sr-only">{caption}</caption>}

        {hasColumnWidths && (
          <colgroup>
            {leafColumns.map((column) => (
              <col key={column.id} style={{ width: column.columnDef.meta?.width }} />
            ))}
          </colgroup>
        )}

        <thead data-slot="table-head">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th key={header.id} scope="col">
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody data-slot="table-body">
          {rows.map((row) => (
            <tr key={row.id} data-slot="table-row">
              {row.getAllCells().map((cell) => (
                <td key={cell.id}>
                  <table.FlexRender cell={cell} />
                </td>
              ))}
            </tr>
          ))}

          {rows.length === 0 && emptyState && (
            <tr data-slot="table-empty">
              <td colSpan={columns.length} className="text-center">
                {emptyState}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export { AkTable };
