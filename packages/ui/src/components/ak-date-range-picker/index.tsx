import { useState } from 'react';
import DatePicker from 'react-datepicker';

import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkPopover, AkPopoverContent, AkPopoverTrigger } from '@irene/ui/ak-popover';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';

import type { AkDateRange, AkDateRangeShortcut } from './helpers';

import 'react-datepicker/dist/react-datepicker.css';
import styles from './styles.module.css';

interface AkDateRangePickerProps {
  value: AkDateRange;
  onChange: (range: AkDateRange) => void;
  shortcuts?: AkDateRangeShortcut[];
  maxDate?: Date;
  minDate?: Date;
  fromLabel: string;
  toLabel: string;
  previousMonthLabel: string;
  nextMonthLabel: string;
  daysLabel: string;
  formatDate: (date: Date) => string;
  className?: string;
}

/** How long a day is in milliseconds, which a span is counted in. */
const MILLISECONDS_IN_DAY = 86_400_000;

/**
 * When a day began in UTC, so no hour is lost or repeated to a clock change.
 *
 * It reads the date rather than setting it, because the dates it is given
 * belong to whoever is holding the range.
 */
const getUTCMidnightTime = (date: Date) =>
  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * The month the calendar opens on.
 *
 * The range's end is what a reader came to change, and the second panel shows
 * the month after the first, so the calendar opens a month back and the end
 * lands on the right-hand panel rather than off the left of the view.
 *
 * @param end - The end of the range being shown, absent while one is being picked.
 * @returns The month to open on, or nothing to leave it to the calendar.
 */
const getOpeningMonth = (end: Date | null) =>
  end ? new Date(end.getFullYear(), end.getMonth() - 1, 1) : undefined;

/** How many days a span covers, counting both of its ends. */
const countDaysInRange = ([start, end]: AkDateRange) =>
  start && end
    ? Math.round((getUTCMidnightTime(end) - getUTCMidnightTime(start)) / MILLISECONDS_IN_DAY) + 1
    : 0;

/** Whether two spans cover the same days, which is how a shortcut knows it is the chosen one. */
const isSameRange = (one: AkDateRange, other: AkDateRange) =>
  one[0]?.toDateString() === other[0]?.toDateString() &&
  one[1]?.toDateString() === other[1]?.toDateString();

/**
 * Picks a span of days, from a calendar of two months side by side.
 *
 * The range is only handed back once both ends are set, so a caller never
 * refetches against half a range while the second click is still to come. The
 * shortcuts set both ends at once and close the calendar, which is how most
 * ranges are chosen.
 *
 * @param props.value - The range being shown.
 * @param props.onChange - Called with the range once both ends are set.
 * @param props.shortcuts - Ranges offered beside the calendar.
 * @param props.maxDate - The latest day that can be picked.
 * @param props.minDate - The earliest day that can be picked.
 * @param props.fromLabel - Stands in for the start until one is picked.
 * @param props.toLabel - Stands in for the end until one is picked.
 * @param props.previousMonthLabel - Names the control that steps the calendar back.
 * @param props.nextMonthLabel - Names the control that steps it forward.
 * @param props.daysLabel - Names the unit the span is counted in.
 * @param props.formatDate - Writes a picked day the way the page writes dates.
 * @param props.className - Laid out by whatever holds it.
 */
export function AkDateRangePicker({
  value,
  onChange,
  shortcuts = [],
  maxDate,
  minDate,
  fromLabel,
  toLabel,
  previousMonthLabel,
  nextMonthLabel,
  daysLabel,
  formatDate,
  className,
}: Readonly<AkDateRangePickerProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingRange, setPendingRange] = useState<AkDateRange>(value);
  const [start, end] = pendingRange;

  /* Named by the shortcut that set it, where one did: a span reads better than two dates. */
  const selectedShortcut = shortcuts.find((shortcut) => isSameRange(shortcut.range(), value));

  // Called when a range is picked.
  const handleRangePicked = (range: AkDateRange) => {
    setPendingRange(range);

    /* Both ends are needed: a half-range would read as "everything since". */
    if (range[0] && range[1]) {
      onChange(range);
      setIsOpen(false);
    }
  };

  // Called when a shortcut is picked.
  const handleShortcutPicked = (shortcut: AkDateRangeShortcut) => {
    const range = shortcut.range();

    setPendingRange(range);
    onChange(range);
    setIsOpen(false);
  };

  /* Reopening starts from what is in force, not from a range abandoned half-picked. */
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);

    if (open) {
      setPendingRange(value);
    }
  };

  return (
    <AkPopover open={isOpen} onOpenChange={handleOpenChange}>
      <AkPopoverTrigger asChild>
        <AkButton
          variant="outlined"
          color="textPrimary"
          className={cn('gap-2 font-normal', className)}
          leftIcon={<AkIcon name="material-symbols:calendar-month" className="size-4.5" />}
          rightIcon={
            <AkIcon
              name="material-symbols:keyboard-arrow-down"
              className={cn('size-4.5 transition-transform', isOpen && 'rotate-180')}
            />
          }
          data-test-date-range-picker-trigger
        >
          {selectedShortcut && (
            <AkTypography tag="span" variant="body2" fontWeight="medium" color="inherit">
              {selectedShortcut.label}
            </AkTypography>
          )}

          <AkTypography tag="span" variant="body2" color="textSecondary">
            {value[0] ? formatDate(value[0]) : fromLabel} —{' '}
            {value[1] ? formatDate(value[1]) : toLabel}
          </AkTypography>
        </AkButton>
      </AkPopoverTrigger>

      <AkPopoverContent
        align="end"
        className="w-auto overflow-hidden border-border p-0 shadow-9"
        data-test-date-range-picker-panel
      >
        {/* What is being picked, so the span is read while it is still being chosen. */}
        <header className="flex items-baseline justify-between gap-6 border-b border-divider px-4 py-2.5">
          <AkTypography tag="span" variant="body2" fontWeight="medium">
            {start ? formatDate(start) : fromLabel} — {end ? formatDate(end) : toLabel}
          </AkTypography>

          {countDaysInRange(pendingRange) > 0 && (
            <AkTypography tag="span" variant="body3" color="textSecondary" className="tabular-nums">
              {countDaysInRange(pendingRange).toLocaleString()} {daysLabel}
            </AkTypography>
          )}
        </header>

        <div className="flex gap-0">
          {shortcuts.length > 0 && (
            <div className="flex flex-col gap-0.5 border-r border-divider p-2">
              {shortcuts.map((shortcut) => (
                <AkButton
                  key={shortcut.id}
                  variant="text"
                  color="textPrimary"
                  size="sm"
                  className={cn(
                    'justify-start px-2.5 whitespace-nowrap no-underline hover:bg-hover-light',
                    selectedShortcut?.id === shortcut.id && 'bg-primary/8 text-primary'
                  )}
                  onClick={() => handleShortcutPicked(shortcut)}
                  data-test-date-range-picker-shortcut={shortcut.id}
                >
                  <AkTypography tag="span" variant="body2" color="inherit">
                    {shortcut.label}
                  </AkTypography>
                </AkButton>
              ))}
            </div>
          )}

          <DatePicker
            inline
            calendarClassName={styles.calendar}
            selectsRange
            monthsShown={2}
            openToDate={getOpeningMonth(end)}
            startDate={start}
            endDate={end}
            maxDate={maxDate}
            minDate={minDate}
            onChange={(range) => handleRangePicked(range as AkDateRange)}
            renderCustomHeader={({
              monthDate,
              customHeaderCount,
              decreaseMonth,
              increaseMonth,
              prevMonthButtonDisabled,
              nextMonthButtonDisabled,
            }) => (
              <div className="flex items-center justify-between gap-2 px-1.5 pb-1">
                <AkIconButton
                  size="small"
                  aria-label={previousMonthLabel}
                  onClick={decreaseMonth}
                  disabled={prevMonthButtonDisabled}
                  className={cn(customHeaderCount > 0 && 'invisible')}
                  data-test-date-range-picker-previous
                >
                  <AkIcon name="material-symbols:chevron-left" className="size-5" />
                </AkIconButton>

                <AkTypography tag="span" variant="body2" fontWeight="medium">
                  {monthDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
                </AkTypography>

                <AkIconButton
                  size="small"
                  aria-label={nextMonthLabel}
                  onClick={increaseMonth}
                  disabled={nextMonthButtonDisabled}
                  className={cn(customHeaderCount === 0 && 'invisible')}
                  data-test-date-range-picker-next
                >
                  <AkIcon name="material-symbols:chevron-right" className="size-5" />
                </AkIconButton>
              </div>
            )}
          />
        </div>
      </AkPopoverContent>
    </AkPopover>
  );
}

/* The types live with the helpers; a component file exports only components. */
export type { AkDateRange, AkDateRangeShortcut, AkDateRangeShortcutId } from './helpers';
