import type { ApiSkThirdPartyFinding } from '@irene/api/services/storeknox';
import type { MessageId } from '@irene/translations/messages';

/** One category of findings on the app details page. */
export type FindingGroup = {
  id: string;
  label: string;
  descriptionKey?: MessageId;
  potentialRisks: number;
  findings: ApiSkThirdPartyFinding[];
};

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'];

/* The five categories the server names and the description each carries. */
const CATEGORY_DESCRIPTIONS = new Map<string, MessageId>([
  [
    'sensitive_capabilities',
    'storeknox.thirdPartyFinding.categoryDescriptions.sensitiveCapabilities',
  ],
  ['device_manipulation', 'storeknox.thirdPartyFinding.categoryDescriptions.deviceManipulation'],
  [
    'monitoring_indicators',
    'storeknox.thirdPartyFinding.categoryDescriptions.monitoringIndicators',
  ],
  ['control_bypass', 'storeknox.thirdPartyFinding.categoryDescriptions.controlBypass'],
  [
    'suspicious_indicators',
    'storeknox.thirdPartyFinding.categoryDescriptions.suspiciousIndicators',
  ],
]);

/* A severity outside the list sorts as info, as irene's does. */
const _severityRank = (severity: string): number => {
  const rank = SEVERITY_ORDER.indexOf(severity.toLowerCase());

  return rank === -1 ? SEVERITY_ORDER.indexOf('info') : rank;
};

const _humanize = (category: string): string =>
  category.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

/**
 * Groups findings by category, in the order each category is first seen, with the findings of a
 * group sorted from critical to info. A finding without a category lands in Others.
 *
 * @param findings - The findings the scan reported.
 */
export function groupFindings(findings: ApiSkThirdPartyFinding[]): FindingGroup[] {
  const grouped = new Map<string, ApiSkThirdPartyFinding[]>();

  for (const finding of findings) {
    const id = (finding.category ?? 'others').toLowerCase();

    grouped.set(id, [...(grouped.get(id) ?? []), finding]);
  }

  return [...grouped].map(([id, members]) => ({
    id,
    label: _humanize(id),
    descriptionKey: CATEGORY_DESCRIPTIONS.get(id.replace(/[\s-]+/g, '_')),
    potentialRisks: members.filter((finding) => finding.is_potential_risk).length,
    findings: [...members].sort((a, b) => _severityRank(a.severity) - _severityRank(b.severity)),
  }));
}

/**
 * How many findings are potential risks and how many checks came back clean.
 *
 * @param findings - The findings the scan reported.
 */
export function countPotentialRisks(findings: ApiSkThirdPartyFinding[]): {
  potential: number;
  clean: number;
} {
  const potential = findings.filter((finding) => finding.is_potential_risk).length;

  return { potential, clean: findings.length - potential };
}
