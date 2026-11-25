import { akMT } from '@irene/translations/intl';
import type { ApiOrganizationAiFeatureSettings } from '@irene/api/services/organization';
import type { OrganizationUpsellStatus } from '@irene/api/stores/organization';
import type { PoweredByAiSection } from '@/components/powered-by-ai';

/** Which AI feature a row is about, named as the settings name it. */
export type AiFeatureKey = keyof ApiOrganizationAiFeatureSettings;

/** One row of the tab: what the feature is, whether it may be turned, and what it does with data. */
export interface AiFeature {
  key: AiFeatureKey;
  header: string;
  description: string;

  /** Whether the organization is entitled to it. A feature it lacks is shown but cannot be turned. */
  isEntitled: boolean;

  /**
   * What the AI does with the account's data, which the reader is asked to
   * read before turning the feature on or off. A feature with nothing to
   * explain is turned straight away.
   */
  sections: PoweredByAiSection[] | null;
}

/** What the AI behind the reporting feature does with an account's data. */
const reportingSections = (): PoweredByAiSection[] => [
  {
    title: akMT('reportModule.aiDataAccess'),
    body: akMT('reportModule.aiDataAccessDescription'),
  },

  {
    title: akMT('reportModule.aiDataUsage'),
    body: akMT('reportModule.aiDataUsageDescription'),
  },

  {
    title: akMT('reportModule.aiDataProtection'),

    points: [
      akMT('reportModule.aiDataProtectionList.item1'),
      akMT('reportModule.aiDataProtectionList.item2'),
      akMT('reportModule.aiDataProtectionList.item3'),
    ],
  },
];

/** What the AI behind the privacy feature does with an account's data. */
const privacySections = (): PoweredByAiSection[] => [
  {
    title: akMT('privacyModule.piiAiDrawer.aiDataQ1'),
    body: akMT('privacyModule.piiAiDrawer.aiDataQ1Desc'),
  },

  {
    title: akMT('privacyModule.piiAiDrawer.aiDataQ2'),
    body: akMT('privacyModule.piiAiDrawer.aiDataQ2Desc'),
  },

  {
    title: akMT('privacyModule.piiAiDrawer.aiDataQ3'),
    body: akMT('privacyModule.piiAiDrawer.aiDataQ3Desc'),
  },
];

/**
 * The rows this tab offers, in irene's order.
 *
 * A feature the organization is not entitled to is listed but cannot be
 * turned, unless the upsell for it is hidden — then it is left out
 * altogether, as irene leaves it out.
 *
 * @param entitlements - Which features the organization may use.
 * @param withheld - Which of them are hidden rather than advertised.
 * @returns The rows to draw.
 */
export function buildAiFeatures(
  entitlements: { reporting: boolean; pii: boolean },
  withheld: OrganizationUpsellStatus
): AiFeature[] {
  const features: Array<AiFeature | false> = [
    !withheld.aiReporting && {
      key: 'reporting' as const,
      header: akMT('reportModule.settingsHeader'),
      description: akMT('reportModule.settingsDesc'),
      isEntitled: entitlements.reporting,
      sections: reportingSections(),
    },

    !withheld.aiPii && {
      key: 'pii' as const,
      header: akMT('privacyModule.piiLabel'),
      description: akMT('privacyModule.piiDesc'),
      isEntitled: entitlements.pii,
      sections: privacySections(),
    },
  ];

  return features.filter((feature) => feature !== false);
}
