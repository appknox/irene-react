import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { buildSubmission } from '@tests/factories';

import { serverMarkupAsText } from './server-markup';
import { getUploadHeader, getUploadSubText, type UploadMessageState } from './upload-messages';

const FAILED = 'Upload failed';

const state = (overrides: Partial<UploadMessageState> = {}): UploadMessageState => ({
  userCanAccessSubmission: false,
  canInitiateUpload: false,
  isOwner: false,
  fileIsBeingAnalyzed: false,
  uploadFailed: false,
  submission: null,
  submissionErrorMessage: null,
  ...overrides,
});

describe('getUploadHeader', () => {
  it('reports an analysed or failed upload the account can see', () => {
    expect(
      getUploadHeader(state({ userCanAccessSubmission: true, fileIsBeingAnalyzed: true }), FAILED)
    ).toBe(akMT('storeknox.initiateUploadMessages.uploadCompleted'));

    expect(
      getUploadHeader(state({ userCanAccessSubmission: true, uploadFailed: true }), FAILED)
    ).toBe(FAILED);
  });

  it('invites an upload of an app that is not on Appknox', () => {
    expect(getUploadHeader(state({ canInitiateUpload: true }), FAILED)).toBe(
      akMT('storeknox.appNotInAppknoxHeader')
    );
  });

  it('tells an owner the upload awaits completion, and anyone else it has started', () => {
    expect(getUploadHeader(state({ isOwner: true }), FAILED)).toBe(
      akMT('storeknox.initiateUploadMessages.uploadPendingCompletion')
    );

    expect(getUploadHeader(state(), FAILED)).toBe(
      akMT('storeknox.initiateUploadMessages.uploadInitiatedHeader')
    );
  });
});

describe('getUploadSubText', () => {
  it('gives the failure’s reason for a failed upload the account can see', () => {
    const submission = buildSubmission();

    expect(
      getUploadSubText(state({ userCanAccessSubmission: true, uploadFailed: true, submission }))
        .text
    ).toBe(submission.reason);
  });

  it('describes an analysed upload and an app not on Appknox', () => {
    expect(
      getUploadSubText(state({ userCanAccessSubmission: true, fileIsBeingAnalyzed: true })).text
    ).toBe(akMT('storeknox.initiateUploadMessages.fileBeingAnalyzedMsg'));

    expect(getUploadSubText(state({ canInitiateUpload: true })).text).toBe(
      akMT('storeknox.appNotInAppknoxDescription')
    );
  });

  it('prefers the server’s error message, marked as markup, over the default', () => {
    expect(getUploadSubText(state({ submissionErrorMessage: '<b>Locked</b>' }))).toEqual({
      text: '<b>Locked</b>',
      isMarkup: true,
    });

    expect(getUploadSubText(state()).text).toBe(
      akMT('storeknox.initiateUploadMessages.uploadInitiatedDesc')
    );
  });
});

describe('serverMarkupAsText', () => {
  it('keeps the text and drops the markup, scripts included', () => {
    expect(serverMarkupAsText('<b>Store</b> link <script>alert(1)</script>expired')).toBe(
      'Store link alert(1)expired'
    );
  });
});
