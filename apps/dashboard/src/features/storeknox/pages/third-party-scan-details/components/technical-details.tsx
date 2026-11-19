import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkChip } from '@irene/ui/ak-chip';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiSkThirdPartyFinding } from '@irene/api/services/storeknox';

import {
  countPotentialRisks,
  groupFindings,
} from '@/features/storeknox/utils/third-party-findings';

import { FindingGroup } from './finding-group';

/**
 * The "Risk Assessment Details" card of a scored app: a heading with the count of potential risks
 * and of clean checks, then the findings by category.
 *
 * @param props.findings - The findings the scan reported.
 */
export function TechnicalDetails({ findings }: Readonly<{ findings: ApiSkThirdPartyFinding[] }>) {
  const { potential, clean } = countPotentialRisks(findings);

  return (
    <section
      className="border-border bg-background flex w-full flex-col overflow-hidden rounded-md border"
      data-test-sk-third-party-technical-details
    >
      <div className="flex w-full items-center justify-between p-3">
        <div className="flex flex-col">
          <AkTypography variant="subtitle1" fontWeight="bold">
            <AkMessageTranslate id="storeknox.technicalDetails" />
          </AkTypography>

          <AkTypography variant="body2" color="textSecondary">
            <AkMessageTranslate id="storeknox.technicalDetailsDescription" />
          </AkTypography>
        </div>

        <div className="flex items-center gap-1">
          <AkChip
            variant="semi-filled"
            color="error"
            size="small"
            label={
              <AkMessageTranslate
                id="storeknox.thirdPartyFinding.countChipLabel"
                values={{
                  label: akMT('storeknox.thirdPartyFinding.potentialRisks'),
                  count: potential,
                }}
              />
            }
            data-test-sk-third-party-risk-count-chip
          />

          <AkChip
            variant="semi-filled"
            color="success"
            size="small"
            label={
              <AkMessageTranslate
                id="storeknox.thirdPartyFinding.countChipLabel"
                values={{
                  label: akMT('storeknox.thirdPartyFinding.noRisksDetected'),
                  count: clean,
                }}
              />
            }
            data-test-sk-third-party-risk-count-chip
          />
        </div>
      </div>

      {groupFindings(findings).map((group) => (
        <FindingGroup key={group.id} group={group} />
      ))}
    </section>
  );
}
