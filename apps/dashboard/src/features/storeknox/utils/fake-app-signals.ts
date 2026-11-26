import { getIntl } from '@irene/translations/intl';
import type { ApiSkFakeApp } from '@irene/api/services/storeknox';
import type { MessageId } from '@irene/translations/messages';

/** How strongly a score or a rule fired. */
export type ScoreLevel = 'high' | 'medium' | 'low';

type ResultKind = 'match' | 'risk';

interface SignalRule {
  rule: string;
  titleKey: MessageId;
}

/** One group of the AI's findings, ported from irene's fake-app details component. */
interface SignalGroupConfig {
  id: 'brand-identity' | 'binary-similarity' | 'security-risk';
  titleKey: MessageId;
  descriptionKey: MessageId;
  rules: ReadonlyArray<SignalRule>;
  scoreField: 'semantic_analysis_score' | 'binary_similarity_score' | 'binary_risk_score';
  resultKind: ResultKind;
  badgeKeys: Record<ScoreLevel, MessageId>;
  /* Brand identity shows even without signals; the other groups drop out. */
  alwaysShown: boolean;
}

const RESULT_LABEL_KEYS: Record<ResultKind, Record<ScoreLevel, MessageId>> = {
  match: {
    high: 'storeknox.fakeApps.strongMatch',
    medium: 'storeknox.fakeApps.partialMatch',
    low: 'storeknox.fakeApps.lowMatch',
  },
  risk: {
    high: 'storeknox.fakeApps.riskDetected',
    medium: 'storeknox.fakeApps.potentialRisk',
    low: 'storeknox.fakeApps.lowRisk',
  },
};

/** The groups of findings a fake app's details page shows, in order, with the rules each reads. */
export const FAKE_APP_SIGNAL_GROUPS: ReadonlyArray<SignalGroupConfig> = [
  {
    id: 'brand-identity',
    titleKey: 'storeknox.fakeApps.brandIdentityAnalysis',
    descriptionKey: 'storeknox.fakeApps.brandIdentityAnalysisDescription',
    scoreField: 'semantic_analysis_score',
    resultKind: 'match',
    alwaysShown: true,
    badgeKeys: {
      high: 'storeknox.fakeApps.highMatch',
      medium: 'storeknox.fakeApps.mediumMatch',
      low: 'storeknox.fakeApps.lowMatch',
    },
    rules: [
      { rule: 'SemanticSimilarityRule', titleKey: 'storeknox.fakeApps.brandAnalysis' },
      { rule: 'DeveloperConsistencyRule', titleKey: 'storeknox.fakeApps.publisherAnalysis' },
      { rule: 'PackageSimilarityRule', titleKey: 'storeknox.fakeApps.packageAnalysis' },
      { rule: 'TitleBrandAbuseRule', titleKey: 'storeknox.fakeApps.appNameAnalysis' },
      { rule: 'LogoSimilarityRule', titleKey: 'storeknox.fakeApps.logoAnalysis' },
      { rule: 'AppFunctionalitySimilarityRule', titleKey: 'storeknox.fakeApps.functionalAnalysis' },
    ],
  },
  {
    id: 'binary-similarity',
    titleKey: 'storeknox.fakeApps.binarySimilarityAnalysis',
    descriptionKey: 'storeknox.fakeApps.binarySimilarityAnalysisDescription',
    scoreField: 'binary_similarity_score',
    resultKind: 'match',
    alwaysShown: false,
    badgeKeys: {
      high: 'storeknox.fakeApps.highSimilarity',
      medium: 'storeknox.fakeApps.mediumSimilarity',
      low: 'storeknox.fakeApps.lowSimilarity',
    },
    rules: [
      { rule: 'SigningCertRule', titleKey: 'storeknox.fakeApps.signingCertAnalysis' },
      { rule: 'CertAttributesRule', titleKey: 'storeknox.fakeApps.certAttributesAnalysis' },
      { rule: 'PermissionDeltaRule', titleKey: 'storeknox.fakeApps.permissionDeltaAnalysis' },
      { rule: 'ObfuscationRule', titleKey: 'storeknox.fakeApps.obfuscationAnalysis' },
      { rule: 'DynamicLoadingRule', titleKey: 'storeknox.fakeApps.dynamicLoadingAnalysis' },
    ],
  },
  {
    id: 'security-risk',
    titleKey: 'storeknox.fakeApps.securityRiskAssessment',
    descriptionKey: 'storeknox.fakeApps.securityRiskAssessmentDescription',
    scoreField: 'binary_risk_score',
    resultKind: 'risk',
    alwaysShown: false,
    badgeKeys: {
      high: 'storeknox.fakeApps.highRisk',
      medium: 'storeknox.fakeApps.potentialRisk',
      low: 'storeknox.fakeApps.lowRisk',
    },
    rules: [
      { rule: 'SpecialPermissionsRule', titleKey: 'storeknox.fakeApps.specialPermissionsAnalysis' },
      { rule: 'ManifestFlagsRule', titleKey: 'storeknox.fakeApps.manifestFlagsAnalysis' },
      { rule: 'PackerDetectionRule', titleKey: 'storeknox.fakeApps.packerDetectionAnalysis' },
      { rule: 'EmbeddedFilesRule', titleKey: 'storeknox.fakeApps.embeddedFilesAnalysis' },
      { rule: 'NativeLibsRule', titleKey: 'storeknox.fakeApps.nativeLibsAnalysis' },
      {
        rule: 'SuspiciousApiChainsRule',
        titleKey: 'storeknox.fakeApps.suspiciousApiChainsAnalysis',
      },
      { rule: 'ImplicitIntentsRule', titleKey: 'storeknox.fakeApps.implicitIntentsAnalysis' },
      { rule: 'NetworkEndpointsRule', titleKey: 'storeknox.fakeApps.networkEndpointsAnalysis' },
      { rule: 'PhishingDomainsRule', titleKey: 'storeknox.fakeApps.phishingDomainsAnalysis' },
    ],
  },
];

/** One rule's finding, ready to draw. */
export interface Signal {
  rule: string;
  title: string;
  level: ScoreLevel;
  resultLabel: string;
  description: string;
}

/** A group of findings with its badge. */
export interface SignalGroup {
  id: SignalGroupConfig['id'];
  title: string;
  description: string;
  badge: { level: ScoreLevel; label: string };
  signals: Signal[];
}

/** Converts a percentage score (0 to 100) to a level: 85 and over high, 65 and over medium, else low. */
export function badgeLevel(score: number): ScoreLevel {
  if (score >= 85) {
    return 'high';
  }

  return score >= 65 ? 'medium' : 'low';
}

/* A plain message as a string; `akMT` on a broad id type returns a ReactNode. */
const _text = (id: MessageId) => getIntl().formatMessage({ id });

const _LEVELS: Record<'LOW' | 'MEDIUM' | 'HIGH', ScoreLevel> = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

/* A rule's score is a number; anything else under its key is not one. */
const _numberAt = (scores: ApiSkFakeApp['ai_scores'], key: string) => {
  const value = scores[key];

  return typeof value === 'number' ? value : undefined;
};

const _justificationAt = (scores: ApiSkFakeApp['ai_scores'], rule: string) => {
  const value = scores[`${rule}_justification`];

  return typeof value === 'string' ? value : '';
};

function _buildGroup(app: ApiSkFakeApp, config: SignalGroupConfig): SignalGroup {
  const ranked: Array<{ score: number; signal: Signal }> = [];

  for (const { rule, titleKey } of config.rules) {
    const score = _numberAt(app.ai_scores, rule);
    const apiLevel = app.ai_score_levels[rule];

    if (score === undefined || apiLevel === undefined) {
      continue;
    }

    const level = _LEVELS[apiLevel];

    ranked.push({
      score,
      signal: {
        rule,
        title: _text(titleKey),
        level,
        resultLabel: _text(RESULT_LABEL_KEYS[config.resultKind][level]),
        description: _justificationAt(app.ai_scores, rule),
      },
    });
  }

  const level = badgeLevel(app[config.scoreField]);

  return {
    id: config.id,
    title: _text(config.titleKey),
    description: _text(config.descriptionKey),
    badge: { level, label: _text(config.badgeKeys[level]) },
    signals: ranked.sort((a, b) => b.score - a.score).map(({ signal }) => signal),
  };
}

/**
 * The findings groups for a fake app's details page. A signal needs both a score and a level;
 * signals run highest score first, and a group without signals drops unless it is always shown.
 */
export function buildSignalGroups(app: ApiSkFakeApp): SignalGroup[] {
  return FAKE_APP_SIGNAL_GROUPS.map((config) => ({ config, group: _buildGroup(app, config) }))
    .filter(({ config, group }) => config.alwaysShown || group.signals.length > 0)
    .map(({ group }) => group);
}
