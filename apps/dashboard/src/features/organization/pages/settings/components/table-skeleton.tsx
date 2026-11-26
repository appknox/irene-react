import { AkSkeleton } from '@irene/ui/ak-skeleton';

/** A row of a table, drawn as the cells it will hold. */
function TableRowSkeleton({ widths }: Readonly<{ widths: string[] }>) {
  return (
    <div className="flex items-center gap-3.5 px-4.25 py-2.75">
      {widths.map((width, cell) => (
        <AkSkeleton key={`${width}-${cell}`} className={`h-3.5 ${width}`} />
      ))}
    </div>
  );
}

/**
 * A table while its rows are read: the header strip and a few rows under it.
 *
 * @param props.widths - What each column holds, as the share of the row it takes.
 * @param props.rows - How many rows to stand in for.
 */
export function TableSkeleton({ widths, rows = 3 }: Readonly<{ widths: string[]; rows?: number }>) {
  return (
    <div className="flex w-full flex-col">
      <div className="flex items-center gap-3.5 px-4.25 py-2.75">
        {widths.map((width, cell) => (
          <AkSkeleton key={`${width}-${cell}`} className={`h-3.5 ${width}`} />
        ))}
      </div>

      {Array.from({ length: rows }, (_unused, row) => (
        <TableRowSkeleton key={row} widths={widths} />
      ))}
    </div>
  );
}
