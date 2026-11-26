import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import {
  ORGANIZATION_ARCHIVE_GENERATED_VIA,
  ORGANIZATION_ARCHIVE_TYPE,
  type ApiOrganizationArchive,
} from '@irene/api/services/organization';

import { akMT } from '@irene/translations/intl';
import { AkSpinner } from '@irene/ui/ak-spinner';
import { AkTypography } from '@irene/ui/ak-typography';

import { CreatedBy } from '../../service-account/components/created-by';
import { archiveStatus } from './archive-status';

dayjs.extend(relativeTime);

/* The pattern a date is written in on this table, rather than one of the locale's own. */
const ARCHIVE_DATE_FORMAT = 'DD MMM YYYY';

/** Who asked for an export: the account that did, or Appknox's own systems. */
export function GeneratedBy({ archive }: Readonly<{ archive: ApiOrganizationArchive }>) {
  if (archive.generated_via === ORGANIZATION_ARCHIVE_GENERATED_VIA.crm) {
    return (
      <AkTypography noWrap data-test-org-archive-generated-by>
        {akMT('system')}
      </AkTypography>
    );
  }

  return <CreatedBy userId={archive.generated_by} />;
}

/**
 * The span an export covers, written once where both ends share a year.
 *
 * @param from - The first day it covers.
 * @param to - The last.
 * @returns The span, as `01 Jan – 31 Mar 2026`.
 */
function writeSpan(from: string | null, to: string | null) {
  const start = dayjs(from);
  const end = dayjs(to);

  const startFormat = start.year() === end.year() ? 'DD MMM' : ARCHIVE_DATE_FORMAT;

  return `${start.format(startFormat)} – ${end.format(ARCHIVE_DATE_FORMAT)}`;
}

/**
 * What the export covers: the kind, and the span where it has one.
 *
 * One line, the kind read plainly and the span after it in the quieter type —
 * the span is what tells two comprehensive exports apart, so it is written out
 * rather than left behind a mark to hover.
 */
export function ReportType({ archive }: Readonly<{ archive: ApiOrganizationArchive }>) {
  const isLatestScan = archive.archive_type === ORGANIZATION_ARCHIVE_TYPE.latestScan;

  return (
    <div className="flex items-baseline gap-1.5">
      <AkTypography noWrap data-test-org-archive-report-type>
        {isLatestScan ? akMT('latestScan') : akMT('comprehensive')}
      </AkTypography>

      {/* Only a comprehensive export covers a span; the latest scan is simply the latest. */}
      {!isLatestScan && (
        <AkTypography noWrap variant="body2" color="textSecondary" data-test-org-archive-duration>
          {writeSpan(archive.from_date, archive.to_date)}
        </AkTypography>
      )}
    </div>
  );
}

/** Where the export stands, which is also what decides whether it can be fetched. */
export function ArchiveStatus({ archive }: Readonly<{ archive: ApiOrganizationArchive }>) {
  const status = archiveStatus(archive);

  if (status === 'available') {
    return (
      <AkTypography className="text-center" data-test-org-archive-status>
        {`${akMT('expires')} ${dayjs(archive.available_until).fromNow()}`}
      </AkTypography>
    );
  }

  if (status === 'inProgress') {
    return (
      <div className="flex items-center justify-center gap-2.75" data-test-org-archive-status>
        <AkSpinner className="size-3.5" />

        <AkTypography>{`${archive.progress_percent}%`}</AkTypography>
      </div>
    );
  }

  return (
    <AkTypography className="text-center" data-test-org-archive-status>
      {status === 'expired' ? akMT('expired') : akMT('errored')}
    </AkTypography>
  );
}
