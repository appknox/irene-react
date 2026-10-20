import { render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { YearStrip } from './year-strip';
import type { ScannedApp } from './apps-by-date';
import type { PointerPosition } from './calendar-tooltip';

const SEGMENT = { year: 2026, from: '2026-01-01', to: '2026-10-19' };

const APPS: ScannedApp[] = [{ packageName: 'com.example.app', platform: '0', count: 7 }];

/* The pointer is the calendar's to track, so a strip on its own starts from nothing. */
function Strip({ isYearNamed }: Readonly<{ isYearNamed: boolean }>) {
  const pointer = useRef<PointerPosition>({ x: 0, y: 0 });

  return (
    <YearStrip
      segment={SEGMENT}
      filesByDate={[{ day: '2026-03-04', value: 7 }]}
      appsByDate={new Map([['2026-03-04', APPS]])}
      isYearNamed={isYearNamed}
      pointer={pointer}
      onDayClick={vi.fn()}
    />
  );
}

describe('YearStrip', () => {
  it('writes the year above the strip where a span covers more than one', () => {
    render(<Strip isYearNamed />);

    expect(screen.getByText('2026')).toBeInTheDocument();
  });

  it('leaves the year off a span that covers only one', () => {
    render(<Strip isYearNamed={false} />);

    expect(screen.queryByText('2026')).not.toBeInTheDocument();
  });
});
