import type { ApiAppScan } from '@irene/api/services/analytics';
import { getUTCDateString } from '@irene/translations/date-time';

/** One app's scanning on one date. */
export interface ScannedApp {
  packageName: string;
  platform: string;
  count: number;
}

/**
 * Gathers the scans under the dates they happened on.
 * An app scanned twice on one date is counted once, since a cell is one date.
 *
 * @param scans - The rows the server answered, in any order.
 * @returns The apps of each date, busiest first, keyed by the UTC date.
 */
export function groupAppsByDate(scans: ApiAppScan[]): Map<string, ScannedApp[]> {
  const days = new Map<string, ScannedApp[]>();

  scans.forEach((scan) => {
    const day = getUTCDateString(scan.created_on_date);
    const apps = days.get(day) ?? [];
    const scanned = apps.find((app) => app.packageName === scan.package_name);

    if (scanned) {
      scanned.count += Number(scan.file_count);
    } else {
      apps.push({
        packageName: scan.package_name,
        platform: scan.platform,
        count: Number(scan.file_count),
      });
    }

    days.set(day, apps);
  });

  /* Busiest first, so the tooltip names the apps that carried the day. */
  days.forEach((apps) => {
    apps.sort((one, other) => other.count - one.count);
  });

  return days;
}

/**
 * How many files were scanned on each date, which is what shades a cell.
 *
 * @param appsByDate - The apps of each date.
 * @returns One entry per date that had any scanning.
 */
export const countFilesByDate = (appsByDate: Map<string, ScannedApp[]>) =>
  [...appsByDate].map(([day, apps]) => ({
    day,
    value: apps.reduce((sum, app) => sum + app.count, 0),
  }));
