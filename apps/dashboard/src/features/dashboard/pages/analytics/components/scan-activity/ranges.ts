import dayjs from 'dayjs';

/** One year of a span, drawn as its own strip of days. */
export interface YearSegment {
  year: number;
  from: string;
  to: string;
}

/**
 * Cuts a span into one segment per calendar year.
 *
 * Two years on one strip would halve the width of every day, so each year gets
 * a strip. The first and last are cut to the span.
 *
 * @param start - The first day of the span.
 * @param end - The last day of the span.
 * @returns One segment per year the span touches, most recent first.
 */
export function getYearSegments(start: Date, end: Date): YearSegment[] {
  const first = dayjs(start);
  const last = dayjs(end);

  /* Most recent first, since the latest scanning is what a reader looks for. */
  return Array.from({ length: last.year() - first.year() + 1 }, (_, offset) => {
    const year = last.year() - offset;
    const opens = dayjs(new Date(year, 0, 1));
    const closes = dayjs(new Date(year, 11, 31));

    return {
      year,
      from: (opens.isBefore(first) ? first : opens).format('YYYY-MM-DD'),
      to: (closes.isAfter(last) ? last : closes).format('YYYY-MM-DD'),
    };
  });
}
