import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkAccordion } from '@irene/ui/ak-accordion';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { AkTypography } from '@irene/ui/ak-typography';

import type { FindingGroup as FindingGroupData } from '@/features/storeknox/utils/third-party-findings';

import { FindingItem } from './finding-item';

/**
 * One category of findings: a summary row with the category's name, an info tooltip for the
 * categories the server names and the count of potential risks, opened by default, over the
 * category's findings. The description is also in the summary for screen readers, since the
 * tooltip opens only for a mouse.
 *
 * @param props.group - The category and its findings, sorted from critical to info.
 */
export function FindingGroup({ group }: Readonly<{ group: FindingGroupData }>) {
  return (
    <AkAccordion
      variant="secondary"
      defaultExpanded
      className="border-border border-t"
      summaryClassName="rounded-none border-0"
      data-test-sk-third-party-category-group
      summaryText={
        <span
          className="flex w-full items-center justify-between gap-3"
          data-test-sk-third-party-category={group.label}
        >
          <span className="flex items-center gap-1">
            <AkTypography tag="span" fontWeight="medium" variant="subtitle1">
              {group.label}
            </AkTypography>

            {group.descriptionKey && <span className="sr-only">{akMT(group.descriptionKey)}</span>}

            {group.descriptionKey && (
              <AkTooltip
                arrow
                className="max-w-75 p-2 whitespace-normal"
                title={akMT(group.descriptionKey)}
              >
                <span
                  className="text-foreground-secondary inline-flex"
                  data-test-sk-third-party-category-info
                >
                  <AkIcon name="material-symbols:info" size="1.25em" />
                </span>
              </AkTooltip>
            )}
          </span>

          <AkTypography tag="span" variant="body2" color="textSecondary">
            <AkMessageTranslate
              id="storeknox.thirdPartyFinding.potentialRisksCount"
              values={{ count: group.potentialRisks }}
            />
          </AkTypography>
        </span>
      }
    >
      {group.findings.map((finding) => (
        <FindingItem key={finding.rule_id} finding={finding} />
      ))}
    </AkAccordion>
  );
}
