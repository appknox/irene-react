import { useMemo } from 'react';

import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkTable } from '@irene/ui/ak-table';
import { createAkTableColumns, type AkTableColumnMeta } from '@irene/ui/ak-table/helpers';

/** One placeholder row. It carries nothing: every cell of it is a placeholder. */
interface TableSkeletonRow {
  id: number;
}

const column = createAkTableColumns<TableSkeletonRow>();

/*
  The placeholders are components, so they are written here rather than inside
  the one below: a component defined during a render is a new type on every
  render, which remounts what it draws.
*/
const HeaderPlaceholder = () => <AkSkeleton width="60%" />;
const CellPlaceholder = () => <AkSkeleton width="80%" />;

/** Props for the `TableSkeleton` component. */
interface TableSkeletonProps {
  /** The table's own columns, which the placeholders are laid out to match. */
  columns: ReadonlyArray<{ meta?: AkTableColumnMeta }>;
  rows?: number;
  dense?: boolean;
  caption: string;
  wrapperClassName?: string;
}

/**
 * Stands in for a table whose rows have not arrived.
 *
 * A real table with placeholder cells, built from the table's own columns, so
 * each placeholder column is the width and alignment its rows will land in and
 * nothing moves when they do.
 *
 * @param props.columns - The columns of the table being waited on.
 * @param props.rows - How many placeholder rows to draw.
 * @param props.dense - Tightens the cells, matching a dense table.
 * @param props.caption - Says what is loading, for a screen reader.
 * @param props.wrapperClassName - Classes for the element that scrolls.
 */
function TableSkeleton({
  columns,
  rows = 5,
  dense,
  caption,
  wrapperClassName,
}: Readonly<TableSkeletonProps>) {
  const columnDefs = useMemo(
    () =>
      columns.map((awaited, index) =>
        column.display({
          id: `placeholder-${index}`,
          header: HeaderPlaceholder,
          cell: CellPlaceholder,
          meta: awaited.meta,
        })
      ),
    [columns]
  );

  const placeholderRows = useMemo(
    () => Array.from({ length: rows }, (_, index) => ({ id: index })),
    [rows]
  );

  return (
    <AkTable
      columns={columnDefs}
      data={placeholderRows}
      dense={dense}
      caption={caption}
      getRowId={(row) => String(row.id)}
      wrapperClassName={wrapperClassName}
      aria-busy
      data-test-table-skeleton
    />
  );
}

export { TableSkeleton };
