import { Link } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { AkTypography } from '@irene/ui/ak-typography';
import InitiateUploadImage from '@irene/ui/svgs/sox-initiate-upload.svg?react';
import InvalidUploadUrl from '@irene/ui/svgs/sox-invalid-upload-url.svg?react';
import UploadCompleted from '@irene/ui/svgs/sox-upload-completed.svg?react';
import type { ApiSkInventoryApp } from '@irene/api/services/storeknox';
import type { ApiSubmission } from '@irene/api/services/submission';

import { DetailsSectionInfo } from '@/features/storeknox/components/details-section';
import { serverMarkupAsText } from '@/features/storeknox/utils/server-markup';
import { isArchived, isDecommissioned, isReadOnly } from '@/features/storeknox/utils/sk-app';
import { skSubmissionFailed, skSubmissionIsAnalyzing } from '@/features/storeknox/utils/submission';
import { getUploadHeader, getUploadSubText } from '@/features/storeknox/utils/upload-messages';
import { useOrganization } from '@/hooks/use-organization';

interface InitiateUploadProps {
  app: ApiSkInventoryApp;
  submission: ApiSubmission | undefined;
  userCanAccessSubmission: boolean;
  isInitiating: boolean;
  onInitiate: () => void;
}

/** Why the upload button is off: the app is gone, archived, or the store is not integrated. */
function _disabledReason(app: ApiSkInventoryApp) {
  if (isDecommissioned(app)) {
    return akMT('storeknox.decommissionedActionDisabled');
  }

  return isArchived(app)
    ? akMT('storeknox.cannotUploadForArchivedApps')
    : akMT('storeknox.initiateUploadComingSoon');
}

/**
 * The button that asks the server to fetch an unscanned app's build from the store, with the last
 * attempt's outcome; an owner who cannot see a pending upload is pointed at namespace approval.
 */
export function InitiateUpload({
  app,
  submission,
  userCanAccessSubmission,
  isInitiating,
  onInitiate,
}: Readonly<InitiateUploadProps>) {
  const { isOwner } = useOrganization();
  const canInitiate = app.can_initiate_upload;

  const uploadFailed = userCanAccessSubmission && skSubmissionFailed(submission);
  const fileIsBeingAnalyzed = userCanAccessSubmission && skSubmissionIsAnalyzing(submission);

  const messageState = {
    userCanAccessSubmission,
    canInitiateUpload: canInitiate,
    isOwner: isOwner(),
    fileIsBeingAnalyzed,
    uploadFailed,
    submission,
    submissionErrorMessage: app.submission_error_message,
  };

  const subText = getUploadSubText(messageState);

  /* Approval updates `availability.appknox` at once but the latest version later, so the link keys on availability. */
  const showNamespacesLink =
    isOwner() && !userCanAccessSubmission && !canInitiate && !app.availability.appknox;

  return (
    <DetailsSectionInfo className="flex-col items-center gap-6 py-12" data-test-sk-initiate-upload>
      {fileIsBeingAnalyzed && <UploadCompleted aria-hidden="true" />}

      {!fileIsBeingAnalyzed && uploadFailed && <InvalidUploadUrl aria-hidden="true" />}

      {!fileIsBeingAnalyzed && !uploadFailed && <InitiateUploadImage aria-hidden="true" />}

      <div className="flex w-full flex-col items-center gap-2">
        <AkTypography fontWeight="bold" align="center" data-test-sk-upload-header>
          {getUploadHeader(messageState, akMT('storeknox.initiateUploadMessages.uploadFailed'))}
        </AkTypography>

        <AkTypography align="center" className="max-w-100" data-test-sk-upload-subtext>
          {subText.isMarkup && typeof subText.text === 'string'
            ? serverMarkupAsText(subText.text)
            : subText.text}
        </AkTypography>
      </div>

      {canInitiate && (
        <AkTooltip disabled={!isReadOnly(app)} arrow side="left" title={_disabledReason(app)}>
          <span className="inline-flex">
            <AkButton
              variant="outlined"
              disabled={isInitiating || isReadOnly(app)}
              leftIcon={<AkIcon name="material-symbols:cloud-upload" />}
              onClick={onInitiate}
            >
              {uploadFailed ? akMT('storeknox.retryUpload') : akMT('storeknox.initiateUpload')}
            </AkButton>
          </span>
        </AkTooltip>
      )}

      {showNamespacesLink && (
        <Link
          to="/dashboard/organization/namespaces"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 font-bold text-primary capitalize underline"
        >
          <AkIcon name="material-symbols:open-in-new" className="size-5.5" />

          <AkMessageTranslate id="notificationModule.viewNamespaces" />
        </Link>
      )}
    </DetailsSectionInfo>
  );
}
