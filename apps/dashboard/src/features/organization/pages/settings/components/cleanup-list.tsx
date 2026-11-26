import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Fragment, useState } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkPagination } from '@irene/ui/ak-pagination';
import { AkSpinner } from '@irene/ui/ak-spinner';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiOrganizationCleanup } from '@irene/api/services/organization';

import { useOrganization } from '@/hooks/use-organization';
import { organizationCleanupsOptions } from '@/queries/organization';

import { CreatedBy } from '../../service-account/components/created-by';

/** The page sizes irene offers on this list. */
const PAGE_SIZES = [10, 25, 50];

/* The pattern a cleanup's date is written in, rather than one of the locale's own. */
const CLEANUP_DATE_FORMAT = 'DD MMM YYYY';

/** What a cleanup is called: who asked for it, or the schedule that ran it. */
function CleanupType({ cleanup }: Readonly<{ cleanup: ApiOrganizationCleanup }>) {
  const isManual = cleanup.type === 'Manual';

  return (
    <span className="flex items-center gap-1" data-test-org-cleanup-type>
      {isManual ? akMT('manual') : akMT('automatic')}

      {isManual && (
        <span className="text-neutral-500">
          (<CreatedBy userId={cleanup.user} />)
        </span>
      )}
    </span>
  );
}

/**
 * The cleanups that have run, a page at a time.
 *
 * Three columns rather than a table, as irene draws them: the date, what ran
 * it, and what it took out of each project.
 */
export function CleanupList() {
  const { selected } = useOrganization();

  const [page, setPage] = useState({ limit: PAGE_SIZES[0] ?? 10, offset: 0 });

  const cleanups = useQuery(organizationCleanupsOptions(selected?.id, page));

  const rows = cleanups.data?.items ?? [];
  const totalItems = cleanups.data?.count ?? 0;
  const isLoading = cleanups.isPending || cleanups.isPlaceholderData;

  return (
    <div className="flex w-full flex-col" data-test-org-cleanup-list>
      <div
        className="
          grid grid-cols-3 gap-3.5 border-b border-divider-strong bg-neutral-100 px-3.5 py-2.75
        "
      >
        {[akMT('date'), akMT('type'), akMT('fileCleanup.status')].map((heading) => (
          <AkTypography key={heading} variant="body2" fontWeight="medium" tag="span">
            {heading}
          </AkTypography>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-7" data-test-org-cleanup-list-loading>
          <AkSpinner className="size-5" />
        </div>
      )}

      {!isLoading && rows.length === 0 && (
        <AkTypography variant="body2" className="py-7 text-center" data-test-org-cleanup-list-empty>
          {akMT('fileCleanup.noCleanup')}
        </AkTypography>
      )}

      {!isLoading &&
        rows.map((cleanup) => (
          <div
            key={cleanup.id}
            className="grid grid-cols-3 gap-3.5 border-b border-divider px-3.5 py-2.75"
            data-test-org-cleanup-row
          >
            <AkTypography variant="body2" tag="span">
              {dayjs(cleanup.created_on).format(CLEANUP_DATE_FORMAT)}
            </AkTypography>

            <AkTypography variant="body2" tag="span">
              <CleanupType cleanup={cleanup} />
            </AkTypography>

            <AkTypography variant="body2" tag="span" data-test-org-cleanup-projects>
              {cleanup.projects.map((project, index) => (
                <Fragment key={project.package_name}>
                  {index > 0 && ', '}
                  {`${project.package_name} (${project.cleaned_files_count} ${akMT('files')})`}
                </Fragment>
              ))}
            </AkTypography>
          </div>
        ))}

      {totalItems > 0 && (
        <AkPagination
          totalItems={totalItems}
          limit={page.limit}
          offset={page.offset}
          itemPerPageOptions={PAGE_SIZES}
          onPageChange={setPage}
          onItemPerPageChange={({ limit }) => setPage({ limit, offset: 0 })}
          tableItemLabel={akMT('fileCleanup.listTitle')}
          perPageLabel={akMT('recordPerPage')}
        />
      )}
    </div>
  );
}
