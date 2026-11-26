import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState } from 'react';

import {
  ORGANIZATION_ARCHIVE_TYPE,
  OrganizationService,
  type ApiOrganizationArchive,
  type ApiOrganizationArchiveType,
  type OrganizationArchiveRequest,
} from '@irene/api/services/organization';

import {
  AkSelect,
  AkSelectContent,
  AkSelectItem,
  AkSelectTrigger,
  AkSelectValue,
} from '@irene/ui/ak-select';

import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkDatePicker, type AkDateRange } from '@irene/ui/ak-date-picker';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkPagination } from '@irene/ui/ak-pagination';
import { AkTable } from '@irene/ui/ak-table';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';
import OrgDataEmpty from '@irene/ui/svgs/org-data-empty.svg?react';

import { useOrganization } from '@/hooks/use-organization';
import { organizationArchivesOptions, organizationKeys } from '@/queries/organization';

import { buildArchiveColumns } from './archive-columns';
import { TableSkeleton } from './table-skeleton';
import { SettingsPanel } from './settings-panel';

/** The page sizes irene offers on this list. */
const PAGE_SIZES = [10, 25, 50];

/** The spans irene offers on this picker, by the design system's own keys. */
const QUICK_SELECTS = ['last7Days', 'last30Days', 'last3Months', 'last6Months', 'lastYear'];

/** How long a span may be, which the endpoint will not export beyond. */
const MAX_SPAN_YEARS = 2;

/* The pattern the chosen span is written in on the trigger. */
const SPAN_FORMAT = 'DD MMM YYYY';

/** The span as the endpoint takes it: the whole of the first day to the end of the last. */
function spanFor({ start, end }: AkDateRange): OrganizationArchiveRequest {
  const span: OrganizationArchiveRequest = {};

  if (start !== null) {
    span.from_date = dayjs(start).startOf('day').toISOString();
  }

  if (end !== null) {
    /* Up to the end of that day, unless it is today, which is only exported as far as now. */
    const isPast = dayjs(end).isBefore(dayjs(), 'day');

    span.to_date = (isPast ? dayjs(end).endOf('day') : dayjs().startOf('minute')).toISOString();
  }

  return span;
}

/** Nothing exported yet, which irene draws in place of the table. */
function NoArchives() {
  return (
    <div
      className="
        flex flex-col items-center justify-center gap-1.75 rounded-xs border border-border py-7
      "
      data-test-org-archive-empty
    >
      <OrgDataEmpty aria-hidden="true" />

      <AkTypography tag="h6" variant="h6">
        {akMT('noArchiveExports')}
      </AkTypography>
    </div>
  );
}

/** The exports already asked for, a page at a time. */
function ArchiveList() {
  const { selected } = useOrganization();

  const [page, setPage] = useState({ limit: PAGE_SIZES[0] ?? 10, offset: 0 });
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const archives = useQuery(organizationArchivesOptions(selected?.id, page));

  const download = useMutation({
    mutationFn: async (archive: ApiOrganizationArchive) => {
      setDownloadingId(archive.id);

      return await OrganizationService.getOrganizationArchiveDownloadUrl(
        Number(selected?.id),
        archive.id
      );
    },

    onSuccess: (url) => {
      if (url === '') {
        akNotify.error(akMT('organizationArchiveDownloadErrored'));

        return;
      }

      window.open(url, '_blank', 'noopener,noreferrer');
    },

    onError: () => {
      akNotify.error(akMT('organizationArchiveDownloadErrored'));
    },

    onSettled: () => {
      setDownloadingId(null);
    },
  });

  const rows = archives.data?.items ?? [];
  const totalItems = archives.data?.count ?? 0;
  const isLoading = archives.isPending || archives.isPlaceholderData;

  return (
    <div className="flex flex-col gap-1">
      <AkTypography tag="h3" variant="subtitle1" data-test-org-archive-list-title>
        {akMT('organizationArchiveTableHeading')}
      </AkTypography>

      <AkTypography variant="body2" color="textSecondary" data-test-org-archive-list-description>
        {akMT('organizationArchiveTableDesc')}
      </AkTypography>

      {isLoading && (
        <div className="my-3.5 max-w-200" data-test-org-archive-loading>
          <TableSkeleton widths={['w-1/5', 'w-1/5', 'w-1/5', 'w-1/5', 'w-1/12']} rows={3} />
        </div>
      )}

      {!isLoading && totalItems === 0 && <NoArchives />}

      {!isLoading && totalItems > 0 && (
        <div className="my-3.5 flex flex-col gap-3.5">
          <AkTable
            columns={buildArchiveColumns((archive) => download.mutate(archive), downloadingId)}
            data={rows}
            caption={akMT('organizationArchiveTableHeading')}
            getRowId={(archive: ApiOrganizationArchive) => String(archive.id)}
            data-test-org-archive-table
          />

          <AkPagination
            totalItems={totalItems}
            limit={page.limit}
            offset={page.offset}
            itemPerPageOptions={PAGE_SIZES}
            onPageChange={setPage}
            onItemPerPageChange={({ limit }) => setPage({ limit, offset: 0 })}
            tableItemLabel={akMT('exports')}
            perPageLabel={akMT('recordPerPage')}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Where an organization exports its data, and what it has exported before.
 *
 * The span and the export control appear once a kind is chosen, as irene
 * reveals them: there is nothing to pick a span for until then.
 */
export function OrganizationArchivePanel() {
  const queryClient = useQueryClient();
  const { selected } = useOrganization();

  const [archiveType, setArchiveType] = useState<ApiOrganizationArchiveType | null>(null);
  const [span, setSpan] = useState<AkDateRange>({ start: null, end: null });

  const kinds = [
    {
      value: ORGANIZATION_ARCHIVE_TYPE.comprehensive,
      label: akMT('comprehensive'),
      description: akMT('organizationArchiveComprehensiveDescription'),
    },
    {
      value: ORGANIZATION_ARCHIVE_TYPE.latestScan,
      label: akMT('latestScan'),
      description: akMT('organizationArchiveLatestScanDescription'),
    },
  ];

  const chosenKind = kinds.find((kind) => kind.value === archiveType);

  const exportData = useMutation({
    mutationFn: (asked: { type: ApiOrganizationArchiveType; span: AkDateRange }) =>
      asked.type === ORGANIZATION_ARCHIVE_TYPE.latestScan
        ? OrganizationService.createLatestScanArchive(Number(selected?.id), spanFor(asked.span))
        : OrganizationService.createOrganizationArchive(Number(selected?.id), spanFor(asked.span)),

    onSuccess: async () => {
      akNotify.success(akMT('organizationArchiveSuccess'));

      await queryClient.invalidateQueries({
        queryKey: organizationKeys.archivesList(selected?.id),
      });
    },

    onError: () => {
      akNotify.error(akMT('organizationArchiveFailed'));
    },
  });

  /* A span longer than the endpoint will export is refused here, and both ends are cleared. */
  const chooseSpan = (chosen: AkDateRange) => {
    const isTooLong =
      chosen.start !== null &&
      chosen.end !== null &&
      dayjs(chosen.end).isAfter(dayjs(chosen.start).add(MAX_SPAN_YEARS, 'years'));

    if (isTooLong) {
      akNotify.error(akMT('organizationArchiveDateRangeExceeded'));
      setSpan({ start: null, end: null });

      return;
    }

    setSpan(chosen);
  };

  return (
    <SettingsPanel title={akMT('organizationArchive')} testAttribute="org-archive">
      <div className="my-5.25 flex flex-col gap-1.75">
        <AkTypography tag="h3" variant="subtitle1" data-test-org-archive-type-title>
          {akMT('organizationArchiveTypeSelectTitle')}
        </AkTypography>

        <div className="flex items-center gap-2.75">
          <AkSelect
            value={archiveType === null ? undefined : String(archiveType)}
            onValueChange={(value) => {
              setArchiveType(Number(value) as ApiOrganizationArchiveType);
              setSpan({ start: null, end: null });
            }}
          >
            <AkSelectTrigger className="w-100" data-test-org-archive-type-select>
              <AkSelectValue placeholder={akMT('organizationArchiveTypeSelectPlaceholder')} />
            </AkSelectTrigger>

            <AkSelectContent>
              {kinds.map((kind) => (
                <AkSelectItem key={kind.value} value={String(kind.value)}>
                  {kind.label}
                </AkSelectItem>
              ))}
            </AkSelectContent>
          </AkSelect>

          {chosenKind && (
            <AkDatePicker
              selected={span}
              onSelect={chooseSpan}
              maxDate={new Date()}
              quickSelectOptions={QUICK_SELECTS}
            >
              <div
                className="
                  flex cursor-pointer items-center rounded-xs border border-border select-none
                "
                role="button"
                tabIndex={0}
                data-test-org-archive-date-range
              >
                <AkIcon name="material-symbols:event" className="mx-2 size-4" aria-hidden />

                {/* Ruled off on both sides, which is how irene sets the dates apart. */}
                <div className="flex items-center gap-1 border-x border-border px-3.5 py-1.75">
                  <AkTypography
                    tag="span"
                    color={span.start === null ? 'textSecondary' : 'textPrimary'}
                  >
                    {span.start === null ? akMT('fromDate') : dayjs(span.start).format(SPAN_FORMAT)}
                  </AkTypography>

                  <AkTypography tag="span" color="textSecondary">
                    -
                  </AkTypography>

                  <AkTypography
                    tag="span"
                    color={span.end === null ? 'textSecondary' : 'textPrimary'}
                  >
                    {span.end === null ? akMT('toDate') : dayjs(span.end).format(SPAN_FORMAT)}
                  </AkTypography>
                </div>

                <AkButton
                  type="button"
                  variant="text"
                  className="min-w-15"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSpan({ start: null, end: null });
                  }}
                  data-test-org-archive-date-clear
                >
                  {akMT('clear')}
                </AkButton>
              </div>
            </AkDatePicker>
          )}

          {chosenKind && (
            <AkButton
              type="button"
              loading={exportData.isPending}
              onClick={() => exportData.mutate({ type: chosenKind.value, span })}
              data-test-org-archive-export
            >
              {exportData.isPending ? akMT('processing') : akMT('organizationArchiveExport')}
            </AkButton>
          )}
        </div>

        {chosenKind && (
          <AkTypography
            variant="body2"
            color="textSecondary"
            className="max-w-200"
            data-test-org-archive-type-description
          >
            {chosenKind.description}
          </AkTypography>
        )}
      </div>

      <ArchiveList />
    </SettingsPanel>
  );
}
