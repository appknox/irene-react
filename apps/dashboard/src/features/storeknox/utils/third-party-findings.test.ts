import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { buildSkThirdPartyFinding } from '@tests/factories';

import { countPotentialRisks, groupFindings } from './third-party-findings';

describe('groupFindings', () => {
  it('groups findings by category in the order first seen, with Others for none', () => {
    const a1 = buildSkThirdPartyFinding({ category: 'Control_Bypass' });
    const b = buildSkThirdPartyFinding({ category: 'network-risk' });
    const a2 = buildSkThirdPartyFinding({ category: 'control_bypass' });
    const none = buildSkThirdPartyFinding({ category: null });

    const groups = groupFindings([a1, b, a2, none]);

    expect(groups.map((group) => group.id)).toEqual(['control_bypass', 'network-risk', 'others']);

    expect(groups.map((group) => group.label)).toEqual([
      'Control Bypass',
      'Network Risk',
      'Others',
    ]);

    expect(groups[0]?.findings).toHaveLength(2);
    expect(groups[2]?.findings).toEqual([none]);
  });

  it("orders a group's findings from critical to info, unknown last with info", () => {
    const category = 'control_bypass';
    const low = buildSkThirdPartyFinding({ category, severity: 'low' });
    const critical = buildSkThirdPartyFinding({ category, severity: 'CRITICAL' });
    const unknown = buildSkThirdPartyFinding({ category, severity: 'weird' });
    const info = buildSkThirdPartyFinding({ category, severity: 'info' });
    const high = buildSkThirdPartyFinding({ category, severity: 'high' });
    const medium = buildSkThirdPartyFinding({ category, severity: 'medium' });

    const [group] = groupFindings([low, unknown, critical, info, high, medium]);

    expect(group?.findings).toEqual([critical, high, medium, low, unknown, info]);
  });

  it('describes only the five known categories', () => {
    const known = [
      ['sensitive_capabilities', 'sensitiveCapabilities'],
      ['device_manipulation', 'deviceManipulation'],
      ['monitoring_indicators', 'monitoringIndicators'],
      ['control_bypass', 'controlBypass'],
      ['suspicious_indicators', 'suspiciousIndicators'],
    ] as const;

    const groups = groupFindings([
      ...known.map(([category]) => buildSkThirdPartyFinding({ category })),
      buildSkThirdPartyFinding({ category: 'other_thing' }),
      buildSkThirdPartyFinding({ category: null }),
    ]);

    expect(groups.slice(0, 5).map((group) => group.descriptionKey)).toEqual(
      known.map(([, key]) => `storeknox.thirdPartyFinding.categoryDescriptions.${key}`)
    );

    expect(groups.slice(5).map((group) => group.descriptionKey)).toEqual([undefined, undefined]);
    expect(akMT('storeknox.thirdPartyFinding.categoryDescriptions.controlBypass')).toBeTruthy();
  });

  it("counts each group's potential risks", () => {
    const category = 'control_bypass';

    const [group] = groupFindings([
      buildSkThirdPartyFinding({ category, is_potential_risk: true }),
      buildSkThirdPartyFinding({ category, is_potential_risk: false }),
      buildSkThirdPartyFinding({ category, is_potential_risk: true }),
    ]);

    expect(group?.potentialRisks).toBe(2);
  });
});

describe('countPotentialRisks', () => {
  it('counts potential risks and clean checks', () => {
    const findings = [
      buildSkThirdPartyFinding({ is_potential_risk: true }),
      buildSkThirdPartyFinding({ is_potential_risk: false }),
      buildSkThirdPartyFinding({ is_potential_risk: false }),
    ];

    expect(countPotentialRisks(findings)).toEqual({ potential: 1, clean: 2 });
    expect(countPotentialRisks([])).toEqual({ potential: 0, clean: 0 });
  });
});
