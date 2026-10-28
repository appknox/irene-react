import { useQuery } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';

import { DateTimeFormat, formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkDateRangePicker, type AkDateRange } from '@irene/ui/ak-date-range-picker';
import { akDateRangeShortcuts, endOfToday } from '@irene/ui/ak-date-range-picker/helpers';
import { cn } from '@irene/ui/cn';

import { useOrganization } from '@/hooks/use-organization';
import { appScansOptions } from '@/queries/analytics';

import { AnalyticsCard } from '../analytics-card';
import { AnalyticsEmpty } from '../analytics-empty';
import { ActivityCalendarSkeleton } from '../analytics-skeletons';
import { countFilesByDate, groupAppsByDate } from './apps-by-date';
import { DayDetailDrawer } from './day-detail-drawer';
import { getYearSegments } from './ranges';
import { YearStrip } from './year-strip';

/**
 * How much was scanned on each day of the span.
 *
 * One cell per day shaded by how much was scanned on it, which answers when
 * the scanning happened at a glance. The cell carries one number, so the apps
 * behind it are named in its tooltip and read in full in a drawer.
 *
 * @param props.range - The span to draw.
 * @param props.onRangeChange - Called with the span the picker was set to.
 */
export function ScanActivity({
  range,
  onRangeChange,
}: Readonly<{ range: AkDateRange; onRangeChange: (range: AkDateRange) => void }>) {
  const organizationId = useOrganization().selectedId();
  const pointer = useRef({ x: 0, y: 0 });

  const [readingDay, setReadingDay] = useState<string>();
  const [start, end] = range;

  const { data: scans, isPending } = useQuery(
    appScansOptions(organizationId, start?.toISOString() ?? '', end?.toISOString() ?? '')
  );

  const appsByDate = useMemo(() => groupAppsByDate(scans ?? []), [scans]);
  const filesByDate = useMemo(() => countFilesByDate(appsByDate), [appsByDate]);

  const segments = useMemo(
    () => getYearSegments(start ?? new Date(), end ?? new Date()),
    [start, end]
  );

  return (
    <AnalyticsCard
      title={akMT('analyticsModule.appsScannedOverTime')}
      actions={
        <AkDateRangePicker
          value={range}
          onChange={onRangeChange}
          shortcuts={akDateRangeShortcuts({
            yearToDate: akMT('analyticsModule.yearToDate'),
            last3Months: akMT('analyticsModule.last3Months'),
            last6Months: akMT('analyticsModule.last6Months'),
            lastYear: akMT('analyticsModule.lastYear'),
          })}
          maxDate={endOfToday()}
          fromLabel={akMT('fromDate')}
          toLabel={akMT('toDate')}
          previousMonthLabel={akMT('previous')}
          nextMonthLabel={akMT('next')}
          daysLabel={akMT('analyticsModule.days')}
          formatDate={(date) => formatDateTime(date, DateTimeFormat.ll)}
        />
      }
    >
      <DayDetailDrawer
        day={readingDay}
        apps={readingDay ? (appsByDate.get(readingDay) ?? []) : []}
        onClose={() => setReadingDay(undefined)}
      />

      {isPending && <ActivityCalendarSkeleton years={segments.length} />}

      {!isPending && filesByDate.length === 0 && (
        <AnalyticsEmpty message={akMT('analyticsModule.nothingScannedInRange')} />
      )}

      {/* A span headed by year labels needs room above the first of them; a lone strip does not. */}
      {!isPending && filesByDate.length > 0 && (
        <div
          className={cn('flex flex-col divide-y divide-divider', segments.length > 1 && 'pt-3')}
          onMouseMove={(event) => {
            pointer.current = { x: event.clientX, y: event.clientY };
          }}
          data-test-scan-activity
        >
          {segments.map((segment) => (
            <YearStrip
              key={segment.year}
              segment={segment}
              filesByDate={filesByDate}
              appsByDate={appsByDate}
              isYearNamed={segments.length > 1}
              pointer={pointer}
              onDayClick={setReadingDay}
            />
          ))}
        </div>
      )}
    </AnalyticsCard>
  );
}
