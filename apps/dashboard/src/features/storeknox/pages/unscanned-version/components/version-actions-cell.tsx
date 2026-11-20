import {
  AkModal,
  AkModalBody,
  AkModalClose,
  AkModalContent,
  AkModalFooter,
  AkModalHeader,
} from '@irene/ui/ak-modal';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkChip } from '@irene/ui/ak-chip';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkSpinner } from '@irene/ui/ak-spinner';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';
import VersionUploadError from '@irene/ui/svgs/am-version-upload-error.svg?react';
import type { ApiSkAppVersion, ApiSkInventoryApp } from '@irene/api/services/storeknox';

import { useVersionUpload } from '@/features/storeknox/hooks/use-version-upload';
import { serverMarkupAsText } from '@/features/storeknox/utils/server-markup';
import { isDecommissioned } from '@/features/storeknox/utils/sk-app';
import { getUploadHeader, getUploadSubText } from '@/features/storeknox/utils/upload-messages';
import { useOrganization } from '@/hooks/use-organization';

type Upload = ReturnType<typeof useVersionUpload>;

/** A failed or someone else's upload: its state, and the way to its details. */
function _IncompleteStatus({ upload }: Readonly<{ upload: Upload }>) {
  const failed = upload.submissionFailed;

  return (
    <div className="flex items-center justify-center">
      <span className="flex items-center gap-2">
        <AkIcon
          name={failed ? 'material-symbols:error' : 'material-symbols:info'}
          className={cn('size-4', failed ? 'text-danger' : 'text-info')}
        />

        <AkTypography tag="span">
          {failed ? akMT('error') : akMT('storeknox.initiateUploadMessages.uploadInitiated')}
        </AkTypography>
      </span>

      <AkDivider direction="vertical" color="dark" className="mx-2 h-4.25" />

      <AkButton
        variant="text"
        color="primary"
        className="min-w-fit underline"
        onClick={() => upload.setModalOpen(true)}
      >
        {failed ? akMT('storeknox.checkDetails') : akMT('details')}
      </AkButton>
    </div>
  );
}

/** The button that starts an upload, off with the reason on hover for an archived or gone app. */
function _InitiateButton({ upload, app }: Readonly<{ upload: Upload; app: ApiSkInventoryApp }>) {
  let disabledReason = akMT('storeknox.initiateUploadComingSoon');

  if (isDecommissioned(app)) {
    disabledReason = akMT('storeknox.decommissionedActionDisabled');
  } else if (upload.readOnly) {
    disabledReason = akMT('storeknox.cannotUploadForArchivedApps');
  }

  return (
    <AkTooltip disabled={!upload.readOnly} arrow side="left" title={disabledReason}>
      <span className="inline-flex items-center gap-3">
        <AkButton
          className="min-w-35"
          disabled={upload.readOnly}
          loading={upload.isInitiating}
          leftIcon={<AkIcon name="material-symbols:cloud-upload" />}
          onClick={upload.initiateUpload}
        >
          <AkMessageTranslate id="storeknox.initiateUpload" />
        </AkButton>

        {!upload.readOnly && (
          <AkChip
            variant="outlined"
            size="small"
            label={akMT('beta')}
            className="border-beta-surface bg-beta-surface text-beta"
          />
        )}
      </span>
    </AkTooltip>
  );
}

/** What became of the last upload and when it was tried, with a retry. */
function UploadInfoModal({ upload }: Readonly<{ upload: Upload }>) {
  const { isOwner } = useOrganization();

  const messageState = {
    userCanAccessSubmission: upload.userCanAccessSubmission,
    canInitiateUpload: upload.canInitiateUpload,
    isOwner: isOwner(),
    fileIsBeingAnalyzed: upload.fileIsBeingAnalyzed,
    uploadFailed: upload.uploadIncomplete,
    submission: upload.submission,
    submissionErrorMessage: upload.submissionErrorMessage,
  };

  const subText = getUploadSubText(messageState);

  return (
    <AkModal open={upload.modalOpen} onOpenChange={upload.setModalOpen}>
      <AkModalContent className="max-w-125">
        <AkModalHeader
          title={akMT('storeknox.initiateUploadInfoModalHeader')}
          closeLabel={akMT('close')}
        />

        <AkModalBody className="flex flex-col gap-6">
          <VersionUploadError aria-hidden="true" />

          <div className="flex w-full flex-col gap-3 pl-1">
            <AkTypography fontWeight="bold" align="center">
              {getUploadHeader(
                messageState,
                akMT('storeknox.initiateUploadMessages.uploadIncomplete')
              )}
            </AkTypography>

            <AkTypography className="max-w-100">
              {subText.isMarkup && typeof subText.text === 'string'
                ? serverMarkupAsText(subText.text)
                : subText.text}
            </AkTypography>

            {upload.submission?.created_on && (
              <>
                <AkDivider color="light" className="my-1" />

                <span className="flex gap-1">
                  <AkIcon name="material-symbols:event-note" />

                  <AkTypography fontWeight="medium" color="secondary">
                    <AkMessageTranslate id="storeknox.lastUploadAttemptText" /> -{' '}
                    {formatDateTime(upload.submission.created_on, 'mediumDate')}
                  </AkTypography>
                </span>
              </>
            )}
          </div>
        </AkModalBody>

        <AkModalFooter className="justify-start px-6 py-4">
          <AkButton
            disabled={!upload.canInitiateUpload || upload.readOnly}
            loading={upload.isInitiating}
            onClick={upload.initiateUpload}
          >
            <AkMessageTranslate id="storeknox.retryUpload" />
          </AkButton>

          <AkModalClose asChild>
            <AkButton variant="outlined" color="neutral">
              <AkMessageTranslate id="cancel" />
            </AkButton>
          </AkModalClose>
        </AkModalFooter>
      </AkModalContent>
    </AkModal>
  );
}

/** The cell's body, by the upload's state, in irene's order. */
function _ActionsBody({ upload, app }: Readonly<{ upload: Upload; app: ApiSkInventoryApp }>) {
  if (upload.isLoading) {
    return <AkSpinner className="mx-auto" />;
  }

  if (upload.showNoActionText) {
    return (
      <AkTypography color="textSecondary">
        <em>
          <AkMessageTranslate id="noActionRequired" />
        </em>
      </AkTypography>
    );
  }

  if (!upload.showUploadedAppCurrentStatus) {
    return <_InitiateButton upload={upload} app={app} />;
  }

  if (upload.uploadIncomplete) {
    return <_IncompleteStatus upload={upload} />;
  }

  return (
    <span className="flex items-center justify-center gap-2">
      <AkIcon
        name={
          upload.appIsAnalyzing ? 'material-symbols:download-done' : 'material-symbols:downloading'
        }
        className={cn('size-4', upload.appIsAnalyzing ? 'text-success' : '-scale-y-100 text-info')}
      />

      <AkTypography tag="span">
        {upload.appIsAnalyzing ? akMT('completed') : `${akMT('uploading')}...`}
      </AkTypography>
    </span>
  );
}

interface VersionActionsCellProps {
  version: ApiSkAppVersion;
  app: ApiSkInventoryApp;
}

/** A store version's action cell: empty once scanned, otherwise start an upload or follow the one under way. */
export function VersionActionsCell({ version, app }: Readonly<VersionActionsCellProps>) {
  const upload = useVersionUpload(version, app);

  return (
    <div className="flex justify-center" data-test-sk-version-actions>
      <_ActionsBody upload={upload} app={app} />

      <UploadInfoModal upload={upload} />
    </div>
  );
}
