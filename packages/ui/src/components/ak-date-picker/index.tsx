import dayjs from 'dayjs';
import { useState, type ReactNode } from 'react';

import {
  AK_DATE_QUICK_SELECTS,
  monthGrid,
  resolveQuickSelects,
  type AkDateRange,
} from '@irene/ui/ak-date-picker/helpers';

import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkPopover, AkPopoverContent, AkPopoverTrigger } from '@irene/ui/ak-popover';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';

interface AkDatePickerProps {
  /** The span as it stands, either end of which may be unset. */
  selected: AkDateRange;

  /** Called with the span once both ends are chosen, or with one end while it is being chosen. */
  onSelect: (range: AkDateRange) => void;

  /** What opens the calendar, which this wraps rather than draws. */
  children: ReactNode;

  /** The latest day that may be chosen, where there is one. */
  maxDate?: Date;

  /** The spans offered outright, by the keys `AK_DATE_QUICK_SELECTS` names. */
  quickSelectOptions?: string[];

  /** The heading above those spans. */
  quickSelectTitle?: string;
}

/** The letters above the columns, starting on Sunday as irene's calendar does. */
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Whether a day falls inside the chosen span, which the grid tints. */
const isWithin = (day: Date, { start, end }: AkDateRange) =>
  start !== null &&
  end !== null &&
  dayjs(day).isAfter(start, 'day') &&
  dayjs(day).isBefore(end, 'day');

/** Whether a day is one of the span's two ends, which the grid marks. */
const isEnd = (day: Date, { start, end }: AkDateRange) =>
  (start !== null && dayjs(day).isSame(start, 'day')) ||
  (end !== null && dayjs(day).isSame(end, 'day'));

/**
 * A span of days, chosen on a calendar.
 *
 * The first press sets the start and clears the end; the second sets the end,
 * and a press before the start starts again from there. The spans down the side
 * set both at once, which is how irene offers the common ones.
 *
 * @param props.selected - The span as it stands.
 * @param props.onSelect - Called as either end is chosen.
 * @param props.children - What opens the calendar.
 * @param props.maxDate - The latest day that may be chosen.
 * @param props.quickSelectOptions - The spans offered outright.
 * @param props.quickSelectTitle - The heading above those spans.
 */
export function AkDatePicker({
  selected,
  onSelect,
  children,
  maxDate,
  quickSelectOptions = [],
  quickSelectTitle = 'Quick Selection',
}: Readonly<AkDatePickerProps>) {
  const [month, setMonth] = useState(() => selected.start ?? new Date());

  const quickSelects = resolveQuickSelects(quickSelectOptions);

  const chooseDay = (day: Date) => {
    const isStartingOver = selected.start === null || selected.end !== null;

    if (isStartingOver || dayjs(day).isBefore(selected.start, 'day')) {
      onSelect({ start: day, end: null });

      return;
    }

    onSelect({ start: selected.start, end: day });
  };

  return (
    <AkPopover>
      <AkPopoverTrigger asChild>{children}</AkPopoverTrigger>

      <AkPopoverContent align="start" className="flex w-auto gap-3.5 p-3.5">
        <div className="flex flex-col gap-2.75" data-test-ak-date-picker-calendar>
          <div className="flex items-center justify-between gap-3.5">
            <AkIconButton
              type="button"
              variant="outlined"
              size="small"
              aria-label="Previous month"
              onClick={() => setMonth(dayjs(month).subtract(1, 'month').toDate())}
              data-test-ak-date-picker-previous
            >
              <AkIcon name="material-symbols:chevron-left" />
            </AkIconButton>

            <AkTypography variant="h6" data-test-ak-date-picker-month>
              {dayjs(month).format('MMMM YYYY')}
            </AkTypography>

            <AkIconButton
              type="button"
              variant="outlined"
              size="small"
              aria-label="Next month"
              onClick={() => setMonth(dayjs(month).add(1, 'month').toDate())}
              data-test-ak-date-picker-next
            >
              <AkIcon name="material-symbols:chevron-right" />
            </AkIconButton>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((weekday, column) => (
              <AkTypography
                key={`${weekday}-${column}`}
                tag="span"
                variant="body3"
                color="textSecondary"
                className="flex size-8 items-center justify-center"
              >
                {weekday}
              </AkTypography>
            ))}

            {monthGrid(month).map((day) => {
              const isOutside = !dayjs(day).isSame(month, 'month');
              const isUnavailable = maxDate !== undefined && dayjs(day).isAfter(maxDate, 'day');

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={isUnavailable}
                  onClick={() => chooseDay(day)}
                  aria-label={dayjs(day).format('DD MMM YYYY')}
                  className={cn(
                    'flex size-8 items-center justify-center rounded-xs text-sm',
                    'hover:bg-hover-light disabled:pointer-events-none disabled:opacity-50',
                    isOutside && 'text-neutral-400',
                    isWithin(day, selected) && 'bg-primary/20',
                    isEnd(day, selected) && 'bg-primary text-primary-foreground'
                  )}
                  data-test-ak-date-picker-day={dayjs(day).format('YYYY-MM-DD')}
                >
                  {dayjs(day).date()}
                </button>
              );
            })}
          </div>
        </div>

        {quickSelects.length > 0 && (
          <div className="flex flex-col items-start gap-1 border-l border-border pl-3.5">
            <AkTypography variant="h6" data-test-ak-date-picker-quick-select-title>
              {quickSelectTitle}
            </AkTypography>

            {quickSelects.map((option) => (
              <AkButton
                key={option.key}
                type="button"
                variant="text"
                onClick={() => onSelect(option.range())}
                data-test-ak-date-picker-quick-select={option.key}
              >
                {option.label}
              </AkButton>
            ))}
          </div>
        )}
      </AkPopoverContent>
    </AkPopover>
  );
}

export { AK_DATE_QUICK_SELECTS };
export type { AkDateRange };
