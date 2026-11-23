import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { buildSkFakeApp } from '@tests/factories';

import { badgeLevel, buildSignalGroups } from './fake-app-signals';

const group = (app: ReturnType<typeof buildSkFakeApp>, id: string) =>
  buildSignalGroups(app).find((g) => g.id === id);

describe('fake app signals', () => {
  it('badges 85 high, 65 medium and 64 low', () => {
    expect(badgeLevel(85)).toBe('high');
    expect(badgeLevel(100)).toBe('high');
    expect(badgeLevel(65)).toBe('medium');
    expect(badgeLevel(84)).toBe('medium');
    expect(badgeLevel(64)).toBe('low');
  });

  it('keeps a rule only when it has both a score and a level', () => {
    const app = buildSkFakeApp({
      ai_scores: { final: 0.5, LogoSimilarityRule: 70, PackageSimilarityRule: 60 },
      ai_score_levels: { LogoSimilarityRule: 'HIGH', TitleBrandAbuseRule: 'LOW' },
    });

    expect(group(app, 'brand-identity')?.signals.map((s) => s.rule)).toEqual([
      'LogoSimilarityRule',
    ]);
  });

  it('orders signals by score, highest first', () => {
    const app = buildSkFakeApp({
      ai_scores: { LogoSimilarityRule: 10, PackageSimilarityRule: 90, TitleBrandAbuseRule: 50 },
      ai_score_levels: {
        LogoSimilarityRule: 'LOW',
        PackageSimilarityRule: 'HIGH',
        TitleBrandAbuseRule: 'MEDIUM',
      },
    });

    expect(group(app, 'brand-identity')?.signals.map((s) => s.rule)).toEqual([
      'PackageSimilarityRule',
      'TitleBrandAbuseRule',
      'LogoSimilarityRule',
    ]);
  });

  it('drops the binary and security groups when they have no signals but keeps brand identity', () => {
    const groups = buildSignalGroups(buildSkFakeApp({ ai_scores: {}, ai_score_levels: {} }));

    expect(groups.map((g) => g.id)).toEqual(['brand-identity']);
    expect(groups[0]?.signals).toEqual([]);
  });

  it('labels match results strong/partial/low and risk results detected/potential/low', () => {
    const app = buildSkFakeApp({
      semantic_analysis_score: 90,
      binary_risk_score: 70,
      ai_scores: {
        LogoSimilarityRule: 90,
        LogoSimilarityRule_justification: 'same logo',
        TitleBrandAbuseRule: 60,
        PackageSimilarityRule: 10,
        PhishingDomainsRule: 80,
        NativeLibsRule: 40,
        ManifestFlagsRule: 5,
      },
      ai_score_levels: {
        LogoSimilarityRule: 'HIGH',
        TitleBrandAbuseRule: 'MEDIUM',
        PackageSimilarityRule: 'LOW',
        PhishingDomainsRule: 'HIGH',
        NativeLibsRule: 'MEDIUM',
        ManifestFlagsRule: 'LOW',
      },
    });

    const brand = group(app, 'brand-identity');
    const security = group(app, 'security-risk');

    expect(brand?.badge).toEqual({ level: 'high', label: akMT('storeknox.fakeApps.highMatch') });

    expect(brand?.signals.map((s) => s.resultLabel)).toEqual([
      akMT('storeknox.fakeApps.strongMatch'),
      akMT('storeknox.fakeApps.partialMatch'),
      akMT('storeknox.fakeApps.lowMatch'),
    ]);

    expect(brand?.signals[0]).toMatchObject({
      title: akMT('storeknox.fakeApps.logoAnalysis'),
      description: 'same logo',
      level: 'high',
    });

    expect(brand?.signals[1]?.description).toBe('');

    expect(security?.badge).toEqual({
      level: 'medium',
      label: akMT('storeknox.fakeApps.potentialRisk'),
    });

    expect(security?.signals.map((s) => s.resultLabel)).toEqual([
      akMT('storeknox.fakeApps.riskDetected'),
      akMT('storeknox.fakeApps.potentialRisk'),
      akMT('storeknox.fakeApps.lowRisk'),
    ]);
  });

  it('badges the binary similarity group by its own score', () => {
    const app = buildSkFakeApp({
      binary_similarity_score: 30,
      ai_scores: { SigningCertRule: 30 },
      ai_score_levels: { SigningCertRule: 'LOW' },
    });

    expect(group(app, 'binary-similarity')?.badge).toEqual({
      level: 'low',
      label: akMT('storeknox.fakeApps.lowSimilarity'),
    });
  });
});
