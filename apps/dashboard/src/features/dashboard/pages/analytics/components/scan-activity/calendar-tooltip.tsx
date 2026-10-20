import { createPortal } from 'react-dom';
import { type CSSProperties } from 'react';

import { DateTimeFormat, formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkTypography } from '@irene/ui/ak-typography';

import type { ScannedApp } from './apps-by-date';

/** Where the pointer is on the page. */
export interface PointerPosition {
  x: number;
  y: number;
}

interface CalendarTooltipProps {
  day: string;
  apps: ScannedApp[];
  pointer: PointerPosition;
}

/**
 * What a day of the calendar says when it is pointed at: the apps scanned on it.
 *
 * A cell carries one number, which answers how much but not what. The apps
 * behind it are named here, busiest first, up to as many as a tooltip can hold;
 * a busier day than that says how many are left and where to read them.
 *
 * It is drawn on the page itself rather than inside the calendar, because the
 * calendar positions its own tooltip with a transform, and anything fixed
 * within one of those is fixed to it rather than to the page.
 *
 * @param props.day - The day, as the calendar writes one.
 * @param props.apps - The apps scanned on it, busiest first.
 * @param props.pointer - Where the pointer is, which the calendar does not pass on.
 */
export function CalendarTooltip({ day, apps, pointer }: Readonly<CalendarTooltipProps>) {
  const scanned = apps.reduce((sum, app) => sum + app.count, 0);
  const tooltipShownApps = apps.slice(0, 15);
  const unshownApps = apps.length - tooltipShownApps.length;

  return createPortal(
    <div
      className="
        pointer-events-none z-50 flex w-72 flex-col gap-2 overflow-hidden rounded-sm bg-foreground
        px-3.5 py-3 font-mono text-background shadow-9
      "
      style={getTooltipStyle(pointer)}
      data-test-calendar-tooltip
    >
      <div className="flex items-baseline justify-between gap-4">
        <AkTypography variant="body2" fontWeight="bold" tag="span" color="inherit">
          {formatDateTime(day, DateTimeFormat.ll)}
        </AkTypography>

        <AkTypography variant="body3" tag="span" color="inherit" className="opacity-70">
          {scanned.toLocaleString()} {akMT('files')}
        </AkTypography>
      </div>

      <ul className="flex min-h-0 flex-col gap-1.5 overflow-hidden border-t border-background/15 pt-2">
        {tooltipShownApps.map((app) => (
          <li key={app.packageName} className="flex items-baseline justify-between gap-4">
            <AkTypography
              variant="body3"
              tag="span"
              color="inherit"
              className="truncate"
              title={app.packageName}
            >
              {app.packageName}
            </AkTypography>

            <AkTypography
              variant="body3"
              fontWeight="medium"
              tag="span"
              color="inherit"
              className="shrink-0 tabular-nums"
            >
              {app.count.toLocaleString()}
            </AkTypography>
          </li>
        ))}
      </ul>

      {unshownApps > 0 && (
        <div className="flex items-baseline justify-between gap-4 border-t border-background/15 pt-2">
          <AkTypography variant="body3" tag="span" color="inherit" className="opacity-70">
            +{unshownApps.toLocaleString()}
          </AkTypography>

          <AkTypography variant="body3" tag="span" color="inherit" className="opacity-70">
            {akMT('analyticsModule.clickToViewAll')}
          </AkTypography>
        </div>
      )}
    </div>,
    document.body
  );
}

/** Get the style for the tooltip based on the pointer position.
 * @param props.x - The x position of the pointer.
 * @param props.y - The y position of the pointer.
 * @returns The style for the tooltip.
 */

function getTooltipStyle({ x, y }: Readonly<PointerPosition>): CSSProperties {
  const TOOLTIP_OFFSET = 16;
  const TOOLTIP_GAP = 12;

  const { innerWidth, innerHeight } = window;
  const hangsDown = y < innerHeight / 2;
  const opensRight = x < innerWidth / 2;

  return {
    position: 'fixed',
    maxHeight: (hangsDown ? innerHeight - y : y) - TOOLTIP_OFFSET - TOOLTIP_GAP,
    ...(hangsDown ? { top: y + TOOLTIP_OFFSET } : { bottom: innerHeight - y + TOOLTIP_OFFSET }),
    ...(opensRight ? { left: x + TOOLTIP_OFFSET } : { right: innerWidth - x + TOOLTIP_OFFSET }),
  };
}
