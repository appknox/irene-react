import dayjs from 'dayjs';

import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkSpinner } from '@irene/ui/ak-spinner';
import { createAkTableColumns } from '@irene/ui/ak-table/helpers';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiOrganizationArchive } from '@irene/api/services/organization';

import { ArchiveStatus, GeneratedBy, ReportType } from './archive-cells';
import { archiveStatus } from './archive-status';

const column = createAkTableColumns<ApiOrganizationArchive>();

/* The pattern a date is written in on this table, rather than one of the locale's own. */
const ARCHIVE_DATE_FORMAT = 'DD MMM YYYY';

/**
 * The columns of the archive export table, in irene's order.
 *
 * @param onDownload - Fetches one export, which the row offers only while it can be fetched.
 * @param downloadingId - The export being fetched, which shows in place of its control.
 * @returns The columns.
 */
export const buildArchiveColumns = (
  onDownload: (archive: ApiOrganizationArchive) => void,
  downloadingId: number | null
) =>
  column.columns([
    column.accessor('created_on', {
      header: () => akMT('organizationTableCreatedOn'),

      cell: ({ getValue }) => (
        <AkTypography noWrap data-test-org-archive-created-on>
          {dayjs(getValue()).format(ARCHIVE_DATE_FORMAT)}
        </AkTypography>
      ),
    }),

    column.display({
      id: 'generated-by',
      header: () => akMT('organizationTableGeneratedBy'),
      cell: ({ row }) => <GeneratedBy archive={row.original} />,
    }),

    column.display({
      id: 'report-type',
      header: () => akMT('reportType'),
      cell: ({ row }) => <ReportType archive={row.original} />,
    }),

    column.display({
      id: 'status',
      header: () => akMT('status'),
      meta: { align: 'center' },
      cell: ({ row }) => <ArchiveStatus archive={row.original} />,
    }),

    column.display({
      id: 'action',
      header: () => akMT('action'),
      meta: { align: 'center' },

      cell: ({ row }) => {
        if (archiveStatus(row.original) !== 'available') {
          return null;
        }

        if (downloadingId === row.original.id) {
          return <AkSpinner className="size-4" data-test-org-archive-downloading />;
        }

        return (
          <AkIconButton
            type="button"
            variant="outlined"
            size="small"
            aria-label={akMT('download')}
            onClick={() => onDownload(row.original)}
            data-test-org-archive-download
          >
            <AkIcon name="material-symbols:download" />
          </AkIconButton>
        );
      },
    }),
  ]);
