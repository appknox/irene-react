import { Link } from '@tanstack/react-router';
import dayjs from 'dayjs';

import { COUNTRY_NAMES_MAP } from '@irene/constants';
import { akMT } from '@irene/translations/intl';
import { AkChip } from '@irene/ui/ak-chip';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiSkAppVersion } from '@irene/api/services/storeknox';

type VersionCellProps = Readonly<{ version: ApiSkAppVersion }>;

/* Values may be undefined because the store can send a code irene does not name; it then shows as the code. */
const COUNTRY_NAMES: Readonly<Record<string, string | undefined>> = COUNTRY_NAMES_MAP;

/**
 * Whether a version has been scanned on Appknox. One scanned after it was
 * first seen reads "Not scanned → Scanned", with a link to the file.
 */
export function ScanStatusCell({ version }: VersionCellProps) {
  const fileId = version.file;
  const isScanned = Boolean(fileId);
  const isNotScanned = Boolean(version.version) && !isScanned;

  const transitioned =
    Boolean(version.file_created_on) &&
    dayjs(version.file_created_on).isAfter(version.created_on ?? undefined);

  return (
    <div className="flex items-center justify-center gap-4" data-test-sk-scan-status>
      {(transitioned || isNotScanned) && (
        <AkChip size="small" variant="semi-filled" color="error" label={akMT('notScanned')} />
      )}

      {transitioned && <AkIcon name="material-symbols:east" aria-hidden="true" />}

      {isScanned && fileId !== null && (
        <span className="flex items-center gap-2">
          <AkChip size="small" variant="semi-filled" color="success" label={akMT('scanned')} />-
          <Link
            to="/dashboard/file/$fileId"
            params={{ fileId: String(fileId) }}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline"
          >
            {akMT('fileID')} - {fileId}
          </Link>
        </span>
      )}
    </div>
  );
}

/** The countries whose store lists the version, each named on hover. */
export function CountriesCell({ version }: VersionCellProps) {
  const codes = version.sk_store_instances.map((instance) => instance.country_code);

  if (codes.length < 1) {
    return <AkTypography>-</AkTypography>;
  }

  return (
    <AkTypography tag="span" className="inline-flex flex-wrap justify-center gap-1">
      {codes.map((code, index) => (
        <AkTooltip key={code} arrow side="top" title={COUNTRY_NAMES[code] ?? code}>
          <span data-test-sk-country={code}>
            {code}
            {index + 1 !== codes.length && ','}
          </span>
        </AkTooltip>
      ))}
    </AkTypography>
  );
}
