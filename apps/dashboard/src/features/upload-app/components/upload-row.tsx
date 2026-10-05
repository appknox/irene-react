import { Fragment } from 'react';

import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkProgressLinear } from '@irene/ui/ak-progress-linear';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';
import AppstoreLogo from '@irene/ui/svgs/appstore-logo.svg?react';
import PlaystoreLogo from '@irene/ui/svgs/playstore-logo.svg?react';

import {
  getSubmissionUploadProgress,
  getUploadStatusDisplayProps,
  type UploadRow,
} from '@/features/upload-app/utils';

import { formatRelativeTime } from '@/utils/relative-time';

import { UploadRowAppPending } from './upload-row-app-pending';

/**
 * One upload: where it came from, what became of it, and the app it carried.
 *
 * A file this tab is still sending reads the same way, with what it knows: the
 * server has no submission for it yet. The row reads from the cache, so a
 * status the server pushes reaches it without anything asking for the list
 * again.
 *
 * @param props.row - The upload, as a file being sent or as the server reported it.
 */
export function UploadRow({ row }: Readonly<{ row: UploadRow }>) {
  const submission = row.kind === 'reported' ? row.submission : undefined;
  const uploadIsInProgress = row.kind === 'sending';

  const isViaLink = Boolean(submission?.url);
  const appData = submission?.app_data;
  const displayProps = getUploadStatusDisplayProps(row.outcome);

  const stage = uploadIsInProgress ? akMT('uploading') : row.submission.status_humanized;
  const occurredAt = uploadIsInProgress ? row.file.startedAt : row.submission.created_on;

  const progress = uploadIsInProgress
    ? row.file.progress
    : getSubmissionUploadProgress(row.submission);

  return (
    <div
      className="w-full animate-in rounded-xs border border-neutral-100 fade-in slide-in-from-top-1"
      data-test-upload-status-row
      data-test-upload-sending-row={row.kind === 'sending' || undefined}
    >
      <div className="flex items-center justify-between px-3.5 py-1.75">
        <div className="flex items-center gap-1">
          <AkIcon
            name={isViaLink ? 'material-symbols:link' : 'material-symbols:desktop-windows'}
            className={isViaLink ? 'size-5.25 text-primary' : 'size-4 text-primary'}
          />

          <AkTypography variant="subtitle2">
            {isViaLink ? akMT('viaLink') : akMT('viaSystem')}
          </AkTypography>
        </div>

        <div className="flex items-center gap-1">
          <AkIcon name={displayProps.icon} className={cn('size-4', displayProps.color)} />

          <AkTypography
            variant="subtitle2"
            className={displayProps.color}
            data-test-upload-status-text
          >
            {displayProps.label}
          </AkTypography>
        </div>
      </div>

      <AkDivider color="light" />

      {appData ? (
        <div className="flex items-center px-3.5 py-1.75">
          <img
            src={appData.icon_url}
            alt=""
            role="none"
            className={`
              size-10 shrink-0 overflow-hidden rounded-full border border-neutral-100 object-contain
            `}
            data-test-upload-status-app-icon
          />

          <div className="flex min-w-0 flex-col pl-1.75">
            <AkTypography variant="subtitle1" className="truncate">
              {appData.name}
            </AkTypography>

            <AkTypography variant="body1" title={appData.package_name} className="truncate">
              {appData.package_name}
            </AkTypography>
          </div>
        </div>
      ) : (
        row.outcome !== 'failed' && <UploadRowAppPending />
      )}

      {row.outcome === 'running' && (
        <Fragment>
          <div className="flex items-center justify-between px-3.5">
            <AkTypography variant="body1" data-test-upload-status-progress-text>
              {`${stage}...`}
            </AkTypography>

            <AkTypography variant="subtitle1">{`${progress}%`}</AkTypography>
          </div>

          <div className="my-3.5 px-3.5">
            <AkProgressLinear
              value={progress}
              label={stage}
              className="bg-success-surface [&::-webkit-progress-value]:bg-success"
            />
          </div>
        </Fragment>
      )}

      {submission && row.outcome === 'failed' && (
        <div className="flex flex-col px-3.5 pt-1.75" data-test-upload-status-failure>
          <AkTypography variant="subtitle1" color="secondary">
            {submission.status_humanized}
          </AkTypography>

          <AkTypography variant="body1">{submission.reason}</AkTypography>
        </div>
      )}

      <div
        className={`
          mt-1.75 flex flex-row-reverse items-center justify-between border-t border-neutral-100
          bg-background-subtle px-3.5 py-1.75
        `}
        data-test-upload-status-footer
      >
        <AkTypography variant="body2" data-test-upload-status-time>
          {formatRelativeTime(occurredAt)}
        </AkTypography>

        {/* A store upload names where it came from, which only it can link back to. */}
        {isViaLink && appData && (
          <div className="flex items-center gap-1.75">
            {appData.platform === ENUMS.PLATFORM.IOS && <AppstoreLogo />}
            {appData.platform === ENUMS.PLATFORM.ANDROID && <PlaystoreLogo />}

            <a
              href={submission?.url}
              rel="noopener noreferrer"
              target="_blank"
              data-test-upload-status-store-link
            >
              <AkTypography variant="body2" color="primary" className="hover:underline">
                {akMT('viewStoreLink')}
              </AkTypography>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
