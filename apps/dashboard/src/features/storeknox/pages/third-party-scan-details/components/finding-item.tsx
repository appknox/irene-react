import { akMT } from '@irene/translations/intl';
import { AkAccordion } from '@irene/ui/ak-accordion';
import { AkChip } from '@irene/ui/ak-chip';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiSkThirdPartyFinding } from '@irene/api/services/storeknox';
import type { MessageId } from '@irene/translations/messages';

/* A labelled block of the opened finding; the label is upper-cased as in irene. */
function _Section({
  labelId,
  children,
}: Readonly<{ labelId: MessageId; children: React.ReactNode }>) {
  return (
    <div className="flex flex-col gap-0.5">
      <AkTypography
        variant="subtitle2"
        fontWeight="bold"
        color="textSecondary"
        className="tracking-wide uppercase"
      >
        {akMT(labelId)}
      </AkTypography>

      {children}
    </div>
  );
}

/**
 * One finding as a collapsed row — a shield icon, its name and a "Potential Risk" or "No Risk
 * Detected" chip — that opens to what it checks and what it found. A clean finding also shows its
 * description; a potential risk shows its business impact instead. Collapsed content is unmounted.
 *
 * @param props.finding - The finding the scan reported.
 */
export function FindingItem({ finding }: Readonly<{ finding: ApiSkThirdPartyFinding }>) {
  const isRisk = finding.is_potential_risk;

  return (
    <AkAccordion
      variant="secondary"
      className="border-border border-t"
      summaryClassName="rounded-none border-0 bg-background px-6"
      summaryText={
        <span
          className="flex w-full items-center justify-between gap-3"
          data-test-sk-third-party-finding={finding.rule_id}
        >
          <span className="flex items-center gap-1.5">
            <AkIcon
              name={isRisk ? 'fluent:shield-error-24-regular' : 'fluent:shield-task-24-regular'}
              size="1.5em"
              className={isRisk ? 'text-danger' : 'text-success'}
            />

            <AkTypography tag="span" fontWeight="medium" variant="subtitle1">
              {finding.name}
            </AkTypography>
          </span>

          <AkChip
            variant="semi-filled"
            size="small"
            color={isRisk ? 'error' : 'success'}
            label={
              isRisk
                ? akMT('storeknox.thirdPartyFinding.potentialRisk')
                : akMT('storeknox.thirdPartyFinding.noRiskDetected')
            }
          />
        </span>
      }
    >
      <div className="border-border mx-8 mb-4 flex flex-col gap-2 border p-4">
        {finding.checks && (
          <_Section labelId="storeknox.thirdPartyFinding.whatItChecks">
            <AkTypography variant="body2">{finding.checks}</AkTypography>
          </_Section>
        )}

        {finding.details.length > 0 && (
          <_Section labelId="storeknox.thirdPartyFinding.findings">
            <ul className="m-0 list-disc pl-5">
              {finding.details.map((detail, index) => (
                <li key={`${index}-${detail}`} className="mb-1 last:mb-0">
                  <AkTypography variant="body2">{detail}</AkTypography>
                </li>
              ))}
            </ul>
          </_Section>
        )}

        {!isRisk && finding.description && (
          <_Section labelId="description">
            <AkTypography variant="body2">{finding.description}</AkTypography>
          </_Section>
        )}

        {isRisk && finding.business_impact && (
          <_Section labelId="storeknox.thirdPartyFinding.potentialBusinessImpact">
            <AkTypography variant="body2">{finding.business_impact}</AkTypography>
          </_Section>
        )}
      </div>
    </AkAccordion>
  );
}
