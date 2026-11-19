import { ENUMS } from '@irene/enums';
import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkTypography } from '@irene/ui/ak-typography';
import TpHighRisk from '@irene/ui/svgs/tp-high-risk.svg?react';
import TpMediumRisk from '@irene/ui/svgs/tp-medium-risk.svg?react';
import TpMinimalRisk from '@irene/ui/svgs/tp-minimal-risk.svg?react';
import type { ApiSkThirdPartyApp } from '@irene/api/services/storeknox';

/* The illustration for a risk status; a code the enum does not name has none, where irene drew the minimal one. */
function _RiskIllustration({ status }: Readonly<{ status: number }>) {
  switch (status) {
    case ENUMS.SK_THIRD_PARTY_APP_RISK_STATUS.HIGH:
      return <TpHighRisk className="w-25" data-test-sk-third-party-risk-illustration="high" />;
    case ENUMS.SK_THIRD_PARTY_APP_RISK_STATUS.MEDIUM:
      return <TpMediumRisk className="w-25" data-test-sk-third-party-risk-illustration="medium" />;
    case ENUMS.SK_THIRD_PARTY_APP_RISK_STATUS.MINIMAL:
      return (
        <TpMinimalRisk className="w-25" data-test-sk-third-party-risk-illustration="minimal" />
      );
    default:
      return null;
  }
}

/**
 * The app's risk score out of 100, the version the analysis is based on and the illustration for
 * its risk status. An app with no score shows "Unavailable" and no illustration. A score of 0 is
 * still a score, as in irene.
 *
 * @param props.app - The app whose scan is shown.
 */
export function RiskSection({ app }: Readonly<{ app: ApiSkThirdPartyApp }>) {
  return (
    <section
      className="flex w-full items-center justify-between border border-border bg-background p-6"
      aria-label={akMT('riskScore')}
      data-test-sk-third-party-risk-section
    >
      <div className="flex flex-col gap-1">
        <AkTypography fontWeight="medium">
          <AkMessageTranslate id="riskScore" />
        </AkTypography>

        {app.score === null ? (
          <AkTypography variant="h3" fontWeight="bold">
            <AkMessageTranslate id="storeknox.riskScoreUnavailable" />
          </AkTypography>
        ) : (
          <>
            <AkTypography variant="h1" fontWeight="bold" data-test-sk-third-party-score>
              {app.score}
              <span className="text-foreground-muted text-2xl">/100</span>
            </AkTypography>

            <AkTypography
              color="textSecondary"
              variant="body2"
              data-test-sk-third-party-version-analysis
            >
              <AkMessageTranslate
                id="storeknox.basedOnVersionAnalysis"
                values={{ version: app.version }}
              />
            </AkTypography>
          </>
        )}
      </div>

      {app.score !== null && <_RiskIllustration status={app.risk_status} />}
    </section>
  );
}
