import { akMT } from '@irene/translations/intl';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiScanCount } from '@irene/api/services/analytics';

import { AnalyticsEmpty } from './analytics-empty';
import { ScanPostureSkeleton } from './analytics-skeletons';

interface ScanPostureProps {
  scanCount?: ApiScanCount;
  isPending: boolean;
}

/** How large a share one count is of the total, as a whole percent. */
const getSharePercent = (part: number, total: number) =>
  total > 0 ? Math.round((part / total) * 100) : 0;

/**
 * The headline: everything scanned, how it divides, and what scans found it.
 *
 * The platform split is a single bar rather than a ring. Two values compared
 * against a whole read along one line, and the bar leaves the total room to be
 * the largest thing on the page, which is what a reader opens this for.
 *
 * The four scan types are read here rather than plotted in a panel of their
 * own: they are four numbers, and four numbers are read as numbers. They are
 * not drawn against the total beside them, because the server counts them over
 * files it excludes offensive-security submissions from, while the total
 * counts every file in every active project.
 *
 * @param props.scanCount - The counts, absent until they arrive.
 * @param props.isPending - Whether the counts are still being read.
 */
export function ScanPosture({ scanCount, isPending }: Readonly<ScanPostureProps>) {
  const total = scanCount?.total_scan_count ?? 0;
  const androidCount = scanCount?.total_android_scan_count ?? 0;
  const iosCount = scanCount?.total_ios_scan_count ?? 0;

  const androidShare = getSharePercent(androidCount, total);

  /*
    The scan types run cool to warm along the palette, and clear of the red the
    calendar and the ranking are drawn in, so a tint here is never mistaken for
    a measure there.
  */
  const scanTypes = [
    {
      id: 'static',
      label: akMT('static'),
      count: scanCount?.static_scan_count ?? 0,
      colourVariable: '--color-blue-900',
    },
    {
      id: 'dynamic',
      label: akMT('dynamic'),
      count: scanCount?.dynamic_scan_count ?? 0,
      colourVariable: '--color-teal-500',
    },
    {
      id: 'api',
      label: akMT('api'),
      count: scanCount?.api_scan_count ?? 0,
      colourVariable: '--color-green-500',
    },
    {
      id: 'manual',
      label: akMT('manual'),
      count: scanCount?.manual_scan_count ?? 0,
      colourVariable: '--color-yellow-700',
    },
  ];

  if (isPending) {
    return <ScanPostureSkeleton />;
  }

  if (total === 0) {
    return (
      <section
        className="rounded-sm border border-border bg-background shadow-3"
        data-test-scan-posture
      >
        <AnalyticsEmpty message={akMT('analyticsModule.nothingScannedYet')} />
      </section>
    );
  }

  return (
    <section
      className="flex flex-col rounded-sm border border-border bg-background shadow-3"
      data-test-scan-posture
    >
      <div className="flex flex-col gap-4 px-5 py-4.5 md:flex-row md:items-center md:gap-10">
        <div className="flex shrink-0 flex-col">
          <AkTypography variant="h1" fontWeight="bold" className="leading-none">
            {total.toLocaleString()}
          </AkTypography>

          <AkTypography variant="body2" color="textSecondary">
            {akMT('analyticsModule.scansTotal')}
          </AkTypography>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <AkTypography variant="body3" color="textSecondary">
            {akMT('analyticsModule.platformSplit')}
          </AkTypography>

          <div
            className="flex h-2.5 w-full overflow-hidden rounded-full bg-divider"
            data-test-platform-split
          >
            <div className="bg-primary" style={{ width: `${androidShare}%` }} />

            <div className="flex-1 bg-info" />
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" />

              <AkTypography tag="span" variant="body2">
                {akMT('android')}
              </AkTypography>

              <AkTypography tag="span" variant="body2" color="textSecondary">
                {androidCount.toLocaleString()} · {androidShare}%
              </AkTypography>
            </span>

            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-info" />

              <AkTypography tag="span" variant="body2">
                {akMT('ios')}
              </AkTypography>

              <AkTypography tag="span" variant="body2" color="textSecondary">
                {iosCount.toLocaleString()} · {100 - androidShare}%
              </AkTypography>
            </span>
          </div>
        </div>
      </div>

      <ul
        className="grid grid-cols-2 gap-px border-t border-divider bg-divider sm:grid-cols-4"
        data-test-scan-coverage
      >
        {scanTypes.map((scanType) => (
          <li
            key={scanType.id}
            className="flex flex-col gap-1.5 border-l-3 px-5 py-3.5"
            style={{
              borderLeftColor: `var(${scanType.colourVariable})`,
              backgroundImage: `linear-gradient(to right, color-mix(in oklab, var(${scanType.colourVariable}) 12%, var(--color-background)), var(--color-background))`,
            }}
            data-test-scan-coverage-row={scanType.id}
          >
            <AkTypography
              variant="body3"
              className="uppercase"
              style={{ color: `var(${scanType.colourVariable})` }}
            >
              {scanType.label}
            </AkTypography>

            <AkTypography
              variant="h4"
              fontWeight="bold"
              className="leading-none tabular-nums"
              data-test-scan-coverage-count
            >
              {scanType.count.toLocaleString()}
            </AkTypography>
          </li>
        ))}
      </ul>
    </section>
  );
}
