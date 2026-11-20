import type { ReactNode } from 'react';

import { akMT } from '@irene/translations/intl';
import type { ApiSubmission } from '@irene/api/services/submission';

/** What the upload messages are decided on. */
export interface UploadMessageState {
  userCanAccessSubmission: boolean;
  canInitiateUpload: boolean;
  isOwner: boolean;
  fileIsBeingAnalyzed: boolean;
  uploadFailed: boolean;
  submission: ApiSubmission | null | undefined;
  submissionErrorMessage: string | null | undefined;
}

/**
 * The heading over an upload's state, as irene's `uploadHeaderMsg` picks it.
 *
 * @param failedHeading - The app's section says "failed" where a version's says "incomplete".
 */
export function getUploadHeader(state: UploadMessageState, failedHeading: ReactNode) {
  const pendingForOwner = !state.canInitiateUpload && state.isOwner;

  if (state.userCanAccessSubmission) {
    if (state.fileIsBeingAnalyzed) {
      return akMT('storeknox.initiateUploadMessages.uploadCompleted');
    }

    if (state.uploadFailed) {
      return failedHeading;
    }
  } else if (state.canInitiateUpload) {
    return akMT('storeknox.appNotInAppknoxHeader');
  }

  return pendingForOwner
    ? akMT('storeknox.initiateUploadMessages.uploadPendingCompletion')
    : akMT('storeknox.initiateUploadMessages.uploadInitiatedHeader');
}

/** The line under the heading, as irene's `uploadSubTextMsg`; `isMarkup` flags the server's error message, which may carry HTML. */
export function getUploadSubText(state: UploadMessageState): {
  text: ReactNode;
  isMarkup: boolean;
} {
  if (state.userCanAccessSubmission && state.fileIsBeingAnalyzed) {
    return { text: akMT('storeknox.initiateUploadMessages.fileBeingAnalyzedMsg'), isMarkup: false };
  }

  if (state.userCanAccessSubmission && state.uploadFailed) {
    return { text: state.submission?.reason, isMarkup: false };
  }

  if (!state.userCanAccessSubmission && state.canInitiateUpload) {
    return { text: akMT('storeknox.appNotInAppknoxDescription'), isMarkup: false };
  }

  if (state.submissionErrorMessage) {
    return { text: state.submissionErrorMessage, isMarkup: true };
  }

  return { text: akMT('storeknox.initiateUploadMessages.uploadInitiatedDesc'), isMarkup: false };
}
