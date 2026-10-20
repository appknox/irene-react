import { ResponsiveTimeRange } from '@nivo/calendar';
import type { RefObject } from 'react';

import { AkTypography } from '@irene/ui/ak-typography';
import { getCSSVariableValue } from '@irene/ui/css-variable';

import { CalendarTooltip, type PointerPosition } from './calendar-tooltip';
import type { ScannedApp } from './apps-by-date';
import type { YearSegment } from './ranges';

/** How many files one date of the strip carries, which is how dark it is drawn. */
interface DateFileCount {
  day: string;
  value: number;
}

interface YearStripProps {
  segment: YearSegment;
  filesByDate: DateFileCount[];
  appsByDate: Map<string, ScannedApp[]>;
  isYearNamed: boolean;
  pointer: RefObject<PointerPosition>;
  onDayClick: (day: string) => void;
}

/** The room the weekday ticks need, before the days begin. */
const DAYS_START_PADDING = 32;

/**
 * The theme the strips are drawn in, read from the page's own tokens.
 *
 * A chart is drawn into its own tree rather than the page's, so a token is
 * resolved before it is handed over. The ticks and the year are set lighter
 * than the page's muted text, so they recede behind the days they label.
 *
 * @returns The theme, in nivo's own shape.
 */
function calendarTheme() {
  const legend = getCSSVariableValue('--color-neutral-500', '#9d9d9d');
  const divider = getCSSVariableValue('--color-divider', '#f5f5f5');
  const foreground = getCSSVariableValue('--color-foreground', '#171717');
  const background = getCSSVariableValue('--color-background', '#ffffff');
  const font = getCSSVariableValue('--font-sans', 'ui-sans-serif, system-ui, sans-serif');

  return {
    background: 'transparent',
    text: { fontFamily: font, fontSize: 12, fill: legend },
    labels: { text: { fontFamily: font, fontSize: 11, fill: foreground } },

    axis: {
      domain: { line: { stroke: divider } },
      ticks: { line: { stroke: divider }, text: { fontFamily: font, fontSize: 11, fill: legend } },
    },

    tooltip: {
      container: {
        fontFamily: font,
        fontSize: 12,
        background: foreground,
        color: background,
        borderRadius: 4,
        padding: '6px 10px',
        boxShadow: 'none',
      },
    },
  };
}

/** The ramp a day is shaded along, lightest for one scan. */
const dayColours = () => [
  getCSSVariableValue('--color-red-50', '#ffeeed'),
  getCSSVariableValue('--color-red-100', '#ffd1d4'),
  getCSSVariableValue('--color-primary', '#ff4d3f'),
  getCSSVariableValue('--color-red-600', '#e23123'),
];

/**
 * Builds what the calendar calls with the day it is drawing.
 *
 * @param appsByDate - The apps behind each date.
 * @param pointer - Where the pointer is, which the tooltip places itself by.
 * @returns The calendar's tooltip renderer.
 */
const renderCalendarTooltip =
  (appsByDate: Map<string, ScannedApp[]>, pointer: RefObject<PointerPosition>) =>
  ({ day }: Readonly<{ day: string }>) => (
    <CalendarTooltip day={day} apps={appsByDate.get(day) ?? []} pointer={pointer.current} />
  );

/**
 * One calendar year of the span, as a strip of days.
 *
 * @param props.segment - The year, cut to the span at either end.
 * @param props.filesByDate - Every date of the span with its total.
 * @param props.appsByDate - The apps behind each date, which the tooltip names.
 * @param props.isYearNamed - Whether the year is written above the strip.
 * @param props.pointer - Where the pointer is, which the tooltip places itself by.
 * @param props.onDayClick - Called with the day a cell stands for.
 */
export function YearStrip({
  segment,
  filesByDate,
  appsByDate,
  isYearNamed,
  pointer,
  onDayClick,
}: Readonly<YearStripProps>) {
  return (
    <div className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
      {/* Indented to where the days begin, so the year sits over its own first week. */}
      {isYearNamed && (
        <AkTypography
          variant="body3"
          className="text-neutral-500 tabular-nums"
          style={{ paddingLeft: DAYS_START_PADDING }}
        >
          {segment.year}
        </AkTypography>
      )}

      {/*
        The days are the calendar's own rects, which it offers no way to class.
        Only they carry a corner radius; the one behind them is the background.
      */}
      <div className="h-44 [&_rect[rx]]:cursor-pointer">
        <ResponsiveTimeRange
          data={filesByDate}
          theme={calendarTheme()}
          weekdayTicks={[1, 3, 5]}
          margin={{ top: 32, right: 16, bottom: 8, left: DAYS_START_PADDING }}
          onClick={({ day }) => onDayClick(day)}
          from={segment.from}
          to={segment.to}
          colors={dayColours()}
          dayBorderWidth={3}
          daySpacing={0}
          dayRadius={3}
          tooltip={renderCalendarTooltip(appsByDate, pointer)}
          emptyColor={getCSSVariableValue('--color-neutral-100', '#f5f5f5')}
          dayBorderColor={getCSSVariableValue('--color-background', '#ffffff')}
        />
      </div>
    </div>
  );
}
