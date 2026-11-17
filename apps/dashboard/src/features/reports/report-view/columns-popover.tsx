import { useState, type DragEvent, type KeyboardEvent } from 'react';

import { AkPopover, AkPopoverContent, AkPopoverTrigger } from '@irene/ui/ak-popover';

import { akMT } from '@irene/translations/intl';
import { cn } from '@irene/ui/cn';
import { AkButton } from '@irene/ui/ak-button';
import { AkCheckbox } from '@irene/ui/ak-checkbox';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';

import type { ViewColumn } from './state';

interface ColumnsPopoverProps {
  columns: ViewColumn[];
  onChange: (columns: ViewColumn[]) => void;
  onReset: () => void;
}

/** Moves the column at from to to, keeping every other column in its order. */
const _move = (columns: ViewColumn[], from: number, to: number) => {
  const next = [...columns];
  const [moved] = next.splice(from, 1);

  if (moved) {
    next.splice(to, 0, moved);
  }

  return next;
};

/**
 * The columns the table, downloads and saved view show: tick to show or hide,
 * drag (or Alt with Up and Down) to reorder. Changes apply at once, and at
 * least one column always stays on, as the design asks.
 *
 * @param props.columns - The view's columns, in order.
 * @param props.onChange - Receives the new columns.
 * @param props.onReset - Goes back to the report's own columns.
 */
export function ColumnsPopover({ columns, onChange, onReset }: Readonly<ColumnsPopoverProps>) {
  const [dragged, setDragged] = useState<number | null>(null);
  const selectedCount = columns.filter((column) => column.selected).length;

  const toggle = (field: string, selected: boolean) =>
    onChange(columns.map((column) => (column.field === field ? { ...column, selected } : column)));

  const onDrop = (event: DragEvent, to: number) => {
    event.preventDefault();

    if (dragged !== null && dragged !== to) {
      onChange(_move(columns, dragged, to));
    }

    setDragged(null);
  };

  const onKey = (event: KeyboardEvent, index: number) => {
    const to = event.key === 'ArrowUp' ? index - 1 : event.key === 'ArrowDown' ? index + 1 : -1;

    if (event.altKey && to >= 0 && to < columns.length) {
      event.preventDefault();
      onChange(_move(columns, index, to));
    }
  };

  return (
    <AkPopover>
      <AkPopoverTrigger asChild>
        <AkButton
          variant="outlined"
          color="primary"
          size="sm"
          leftIcon={<AkIcon name="material-symbols:filter-list" />}
          data-test-report-columns-trigger
        >
          {akMT('reportModule.selectedColumns')} · {selectedCount}
        </AkButton>
      </AkPopoverTrigger>

      <AkPopoverContent align="start" className="w-80 p-0" data-test-report-columns>
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <AkTypography fontWeight="medium">{akMT('reportModule.selectedColumns')}</AkTypography>

          <AkButton variant="text" size="sm" onClick={onReset} leftIcon={<AkIcon name="material-symbols:refresh" />}>
            {akMT('reportModule.view.reset')}
          </AkButton>
        </div>

        <ul className="max-h-80 overflow-y-auto py-1">
          {columns.map((column, index) => {
            const isLastShown = column.selected && selectedCount === 1;

            return (
              <li
                key={column.field}
                draggable
                onDragStart={() => setDragged(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => onDrop(event, index)}
                onKeyDown={(event) => onKey(event, index)}
                className={cn('flex items-center gap-2 px-3 py-1.5', dragged === index && 'opacity-50')}
                data-test-report-column={column.field}
              >
                <AkIcon name="material-symbols:drag-indicator" className="cursor-grab text-foreground-muted" />

                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                  <AkCheckbox
                    checked={column.selected}
                    disabled={isLastShown}
                    onCheckedChange={(checked) => toggle(column.field, checked === true)}
                  />

                  <AkTypography tag="span" className="block" noWrap>
                    {column.label}
                  </AkTypography>
                </label>
              </li>
            );
          })}
        </ul>

        <AkTypography variant="body2" color="textSecondary" className="border-t border-border px-4 py-2.5">
          {akMT('reportModule.view.columnsHelp')}
        </AkTypography>
      </AkPopoverContent>
    </AkPopover>
  );
}
