import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  AkDateRangePicker,
  type AkDateRange,
  type AkDateRangeShortcut,
} from '@irene/ui/ak-date-range-picker';

const JANUARY = new Date('2026-01-10T00:00:00.000Z');
const FEBRUARY = new Date('2026-02-10T00:00:00.000Z');

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const SHORTCUTS: AkDateRangeShortcut[] = [
  {
    id: 'last3Months',
    label: 'This month',
    range: () => [JANUARY, FEBRUARY],
  },
];

function Picker({
  onChange = vi.fn(),
  initial = [null, null] as AkDateRange,
  shortcuts = SHORTCUTS,
}) {
  const [range, setRange] = useState<AkDateRange>(initial);

  return (
    <AkDateRangePicker
      value={range}
      onChange={(next) => {
        setRange(next);
        onChange(next);
      }}
      shortcuts={shortcuts}
      fromLabel="From"
      toLabel="To"
      previousMonthLabel="Previous"
      nextMonthLabel="Next"
      daysLabel="Days"
      formatDate={formatDate}
    />
  );
}

const openPicker = () => userEvent.click(screen.getByRole('button'));

describe('AkDateRangePicker', () => {
  it('stands in for both ends until a range is picked', () => {
    render(<Picker />);

    expect(document.querySelector('[data-test-date-range-picker-trigger]')).toHaveTextContent(
      'From — To'
    );
  });

  it('writes the range it holds the way the page writes dates', () => {
    render(<Picker initial={[JANUARY, FEBRUARY]} />);

    expect(document.querySelector('[data-test-date-range-picker-trigger]')).toHaveTextContent(
      `${formatDate(JANUARY)} — ${formatDate(FEBRUARY)}`
    );
  });

  it('stays shut until the trigger is pressed', () => {
    render(<Picker />);

    expect(screen.queryByText('This month')).not.toBeInTheDocument();
  });

  it('opens the calendar from the trigger', async () => {
    render(<Picker />);

    await openPicker();

    expect(await screen.findByText('This month')).toBeInTheDocument();
  });

  it('sets both ends at once from a shortcut', async () => {
    const onChange = vi.fn();

    render(<Picker onChange={onChange} />);

    await openPicker();
    await userEvent.click(await screen.findByText('This month'));

    expect(onChange).toHaveBeenCalledWith([JANUARY, FEBRUARY]);
  });

  it('closes once a shortcut has set the range', async () => {
    render(<Picker />);

    await openPicker();
    await userEvent.click(await screen.findByText('This month'));

    expect(document.querySelector('[data-test-date-range-picker-panel]')).not.toBeInTheDocument();
  });

  it('names the range on the trigger by the shortcut that set it', async () => {
    render(<Picker />);

    await openPicker();
    await userEvent.click(await screen.findByText('This month'));

    expect(document.querySelector('[data-test-date-range-picker-trigger]')).toHaveTextContent(
      'This month'
    );
  });

  it('offers no shortcut column where none are given', async () => {
    render(<Picker shortcuts={[]} />);

    await openPicker();

    expect(
      document.querySelector('[data-test-date-range-picker-shortcut]')
    ).not.toBeInTheDocument();
  });

  it('hands back nothing until both ends are picked', async () => {
    const onChange = vi.fn();

    render(<Picker onChange={onChange} />);

    await openPicker();

    const days = document.querySelectorAll(
      '.react-datepicker__day:not(.react-datepicker__day--outside-month)'
    );

    await userEvent.click(days[5] as HTMLElement);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('hands back the range once the second end is picked', async () => {
    const onChange = vi.fn();

    render(<Picker onChange={onChange} />);

    await openPicker();

    const days = document.querySelectorAll(
      '.react-datepicker__day:not(.react-datepicker__day--outside-month)'
    );

    await userEvent.click(days[5] as HTMLElement);
    await userEvent.click(days[9] as HTMLElement);

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('opens on the two months ending in the range it is showing', async () => {
    render(<Picker initial={[new Date(2026, 0, 10), new Date(2026, 9, 19)]} />);

    await openPicker();

    expect(screen.getByText('September 2026')).toBeInTheDocument();
    expect(screen.getByText('October 2026')).toBeInTheDocument();
    expect(screen.queryByText('January 2026')).not.toBeInTheDocument();
  });

  it('opens on this month until a range is set', async () => {
    const thisMonth = new Date().toLocaleString(undefined, { month: 'long', year: 'numeric' });

    render(<Picker />);

    await openPicker();

    expect(screen.getByText(thisMonth)).toBeInTheDocument();
  });
});
