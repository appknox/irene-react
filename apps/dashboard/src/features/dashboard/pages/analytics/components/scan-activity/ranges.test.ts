import { describe, expect, it } from 'vitest';
import { getYearSegments } from './ranges';

describe('getYearSegments', () => {
  it('cuts a span within one year to that span', () => {
    expect(getYearSegments(new Date(2026, 0, 15), new Date(2026, 9, 19))).toEqual([
      { year: 2026, from: '2026-01-15', to: '2026-10-19' },
    ]);
  });

  it('gives every year the span touches its own segment, most recent first', () => {
    expect(getYearSegments(new Date(2024, 5, 3), new Date(2026, 1, 20))).toEqual([
      { year: 2026, from: '2026-01-01', to: '2026-02-20' },
      { year: 2025, from: '2025-01-01', to: '2025-12-31' },
      { year: 2024, from: '2024-06-03', to: '2024-12-31' },
    ]);
  });

  it('cuts only the ends of the span, leaving the years between whole', () => {
    const segments = getYearSegments(new Date(2024, 5, 3), new Date(2026, 1, 20));

    expect(segments.at(0)).toEqual({ year: 2026, from: '2026-01-01', to: '2026-02-20' });
    expect(segments.at(-1)).toEqual({ year: 2024, from: '2024-06-03', to: '2024-12-31' });
  });
});
