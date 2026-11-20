import { describe, expect, it } from 'vitest';

import { ENUMS } from '@irene/enums';
import { buildSubmission } from '@tests/factories';

import { skSubmissionFailed, skSubmissionIsAnalyzing, skSubmissionProgress } from './submission';

describe('submission helpers', () => {
  it('gives a percentage only for the stages irene lists', () => {
    expect(
      skSubmissionProgress(buildSubmission({ status: ENUMS.SUBMISSION_STATUS.STORE_DOWNLOADING }))
    ).toBe(40);

    expect(
      skSubmissionProgress(buildSubmission({ status: ENUMS.SUBMISSION_STATUS.ANALYZING }))
    ).toBeUndefined();

    expect(skSubmissionProgress(null)).toBeUndefined();
  });

  it('tells a failed upload from one being analysed', () => {
    const failed = buildSubmission({ status: ENUMS.SUBMISSION_STATUS.STORE_UPLOAD_FAILED });
    const analysing = buildSubmission({ status: ENUMS.SUBMISSION_STATUS.ANALYZING });

    expect(skSubmissionFailed(failed)).toBe(true);
    expect(skSubmissionIsAnalyzing(failed)).toBe(false);
    expect(skSubmissionIsAnalyzing(analysing)).toBe(true);
    expect(skSubmissionFailed(undefined)).toBe(false);
  });
});
