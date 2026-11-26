import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkProgressLinear } from '@irene/ui/ak-progress-linear';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';
import NoAccessImage from '@irene/ui/svgs/no-access-image.svg?react';
import UploadCompleted from '@irene/ui/svgs/sox-upload-completed.svg?react';
import UploadProcessing from '@irene/ui/svgs/sox-upload-processing.svg?react';
import type { ApiSkCoreFile, ApiSkInventoryApp } from '@irene/api/services/storeknox';
import type { ApiSubmission } from '@irene/api/services/submission';

import {
  DetailsSectionHeader,
  DetailsSectionInfo,
} from '@/features/storeknox/components/details-section';

import { DetailsInfoRows } from '@/features/storeknox/components/details-info-rows';
import { useVaResults } from '@/features/storeknox/hooks/use-va-results';
import { skFileRiskOptions } from '@/features/storeknox/queries/inventory';

import { InitiateUpload } from './initiate-upload';

/* The finding counts, in irene's order, each with its translation and its dot's colour. */
const RISK_CATEGORIES = [
  { key: 'critical', field: 'risk_count_critical', dot: cn('bg-severity-critical') },
  { key: 'high', field: 'risk_count_high', dot: cn('bg-severity-high') },
  { key: 'medium', field: 'risk_count_medium', dot: cn('bg-severity-medium') },
  { key: 'low', field: 'risk_count_low', dot: cn('bg-severity-low') },
  { key: 'passed', field: 'risk_count_passed', dot: cn('bg-severity-passed') },
  { key: 'untested', field: 'risk_count_unknown', dot: cn('bg-severity-untested') },
] as const;

/** Stands in for the section while the file and the upload load. */
function _Loading() {
  return (
    <DetailsSectionInfo className="items-center">
      <DetailsInfoRows
        rows={[
          {
            id: 'summary',
            title: akMT('summary'),
            value: <AkSkeleton width="500px" height="16px" />,
          },
          {
            id: 'file-id',
            title: akMT('fileID'),
            value: <AkSkeleton width="100px" height="16px" />,
          },
          {
            id: 'version',
            title: akMT('version'),
            value: <AkSkeleton width="100px" height="16px" />,
          },
          {
            id: 'version-code',
            title: akMT('versionCodeTitleCase'),
            value: <AkSkeleton width="100px" height="16px" />,
          },
          {
            id: 'last-scanned',
            title: akMT('storeknox.lastScannedDate'),
            value: <AkSkeleton width="100px" height="16px" />,
          },
        ]}
      />
    </DetailsSectionInfo>
  );
}

/** Says the account cannot see the app's latest file on Appknox. */
function _FileInaccessible() {
  return (
    <DetailsSectionInfo className="flex-col items-center gap-6 py-12" data-test-sk-va-inaccessible>
      <NoAccessImage aria-hidden="true" />

      <div className="flex w-full flex-col items-center gap-2">
        <AkTypography fontWeight="bold" align="center">
          <AkMessageTranslate id="storeknox.noAcessToVAResultsHeaderText" />
        </AkTypography>

        <AkTypography align="center" className="max-w-107.5">
          <AkMessageTranslate id="storeknox.noAcessToVAResultsSubtext" />
        </AkTypography>
      </div>
    </DetailsSectionInfo>
  );
}

interface UploadProgressProps {
  submission: ApiSubmission | undefined;
  progress: number | undefined;
  uploadNotStarted: boolean;
}

/** The upload's progress; the "Completed" branch at 100% is unreachable but kept as irene has it. */
function _UploadProgress({ progress, uploadNotStarted }: Readonly<UploadProgressProps>) {
  const shown = uploadNotStarted ? 0 : (progress ?? 0);
  const completed = progress === 100;

  return (
    <DetailsSectionInfo
      className="min-h-77.5 flex-col items-center justify-center gap-5 py-12"
      data-test-sk-va-progress
    >
      {completed ? <UploadCompleted aria-hidden="true" /> : <UploadProcessing aria-hidden="true" />}

      <AkTypography align="center">
        {completed ? akMT('completed') : akMT('processing')} <strong>{shown}%</strong>
      </AkTypography>

      <AkProgressLinear value={shown} label={akMT('processing')} className="max-w-67.5" />
    </DetailsSectionInfo>
  );
}

/** The latest Appknox file's finding counts, id, version and scan date. */
function LatestFileResults({ file }: Readonly<{ file: ApiSkCoreFile | undefined }>) {
  const risk = useQuery({ ...skFileRiskOptions(file?.id ?? ''), enabled: Boolean(file) });

  const summary = (
    <span className="flex flex-wrap items-center gap-5">
      {RISK_CATEGORIES.map((category) => (
        <span
          key={category.key}
          className="flex items-center gap-3"
          data-test-sk-risk={category.key}
        >
          <span className="flex items-center gap-2">
            <span className={cn('size-2.5 rounded-full', category.dot)} aria-hidden="true" />

            <AkTypography tag="span" fontWeight="regular">
              {akMT(category.key)}
            </AkTypography>
          </span>

          {risk.isPending ? (
            <AkSkeleton variant="rectangular" width="22px" height="19px" />
          ) : (
            <AkTypography tag="span" fontWeight="bold">
              {risk.data?.[category.field]}
            </AkTypography>
          )}
        </span>
      ))}
    </span>
  );

  return (
    <DetailsSectionInfo className="items-center" data-test-sk-va-latest-file>
      <DetailsInfoRows
        rows={[
          { id: 'summary', title: akMT('summary'), value: summary },
          {
            id: 'file-id',
            title: akMT('fileID'),
            value: file && (
              <Link
                to="/dashboard/file/$fileId"
                params={{ fileId: String(file.id) }}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                {file.id}
              </Link>
            ),
          },
          { id: 'version', title: akMT('version'), value: file?.version },
          { id: 'version-code', title: akMT('versionCodeTitleCase'), value: file?.version_code },
          {
            id: 'last-scanned',
            title: akMT('storeknox.lastScannedDate'),
            value: formatDateTime(file?.created_on, 'mediumDate'),
          },
        ]}
      />
    </DetailsSectionInfo>
  );
}

/** The app's latest Appknox scan, or the upload in flight, or the button to start one. */
export function VaResults({ app }: Readonly<{ app: ApiSkInventoryApp }>) {
  const va = useVaResults(app);

  return (
    <div className="flex w-full flex-col">
      <DetailsSectionHeader>
        <AkTypography fontWeight="medium">
          <AkMessageTranslate id="storeknox.latestVAResults" />
        </AkTypography>
      </DetailsSectionHeader>

      {va.panel === 'loading' && <_Loading />}

      {va.panel === 'inaccessible' && <_FileInaccessible />}

      {va.panel === 'progress' && (
        <_UploadProgress
          submission={va.submission}
          progress={va.progress}
          uploadNotStarted={va.uploadNotStarted}
        />
      )}

      {va.panel === 'latest-file' && <LatestFileResults file={va.file} />}

      {va.panel === 'initiate' && (
        <InitiateUpload
          app={app}
          submission={va.submission}
          userCanAccessSubmission={va.userCanAccessSubmission}
          isInitiating={va.isInitiating}
          onInitiate={va.initiateUpload}
        />
      )}
    </div>
  );
}
