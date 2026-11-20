import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkTypography } from '@irene/ui/ak-typography';
import ScvErrored from '@irene/ui/svgs/scv-errored.svg?react';

/** What the page shows instead of the technical details when the app has no score to assess. */
export function AssessmentError() {
  return (
    <div
      className="
        flex w-full flex-col items-center justify-center gap-4 border border-border bg-background
        px-6 py-12
      "
      data-test-sk-third-party-assessment-error
    >
      <ScvErrored aria-hidden="true" />

      <div className="flex flex-col items-center gap-1">
        <AkTypography variant="h6" fontWeight="medium">
          <AkMessageTranslate id="storeknox.riskAssessmentErrorTitle" />
        </AkTypography>

        <AkTypography variant="body2" color="textSecondary">
          <AkMessageTranslate id="storeknox.riskAssessmentErrorDescription" />
        </AkTypography>
      </div>
    </div>
  );
}
