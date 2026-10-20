import { describe, expect, it } from 'vitest';

import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';
import { buildRecentIssue, buildVulnerability } from '@tests/factories';

import {
  describeIssues,
  formatIssueBarLabel,
  formatIssueTooltip,
  getIssueAtRow,
  rankIssues,
} from './describe-issues';

describe('describeIssues', () => {
  it('names an issue from the catalogue', () => {
    const vulnerability = buildVulnerability();
    const issue = buildRecentIssue({ vulnerability: vulnerability.id });

    expect(describeIssues([issue], [vulnerability])[0].name).toBe(vulnerability.name);
  });

  it('keeps the count the endpoint reported', () => {
    const vulnerability = buildVulnerability();
    const issue = buildRecentIssue({ vulnerability: vulnerability.id, count: 42 });

    expect(describeIssues([issue], [vulnerability])[0].count).toBe(42);
  });

  it('reads the kinds of scan a vulnerability is found by', () => {
    const vulnerability = buildVulnerability({
      types: [ENUMS.VULNERABILITY_TYPE.STATIC, ENUMS.VULNERABILITY_TYPE.API],
    });

    const issue = buildRecentIssue({ vulnerability: vulnerability.id });

    expect(describeIssues([issue], [vulnerability])[0].scanTypes).toEqual([
      akMT('static'),
      akMT('api'),
    ]);
  });

  it('states a kind this build has no name for, rather than nothing', () => {
    const vulnerability = buildVulnerability({ types: [99] });
    const issue = buildRecentIssue({ vulnerability: vulnerability.id });

    expect(describeIssues([issue], [vulnerability])[0].scanTypes).toEqual(['99']);
  });

  it('falls back to the id for a vulnerability the catalogue does not carry', () => {
    const issue = buildRecentIssue({ vulnerability: 404 });

    expect(describeIssues([issue], [])[0].name).toBe('404');
  });

  it('falls back the same way before the catalogue has loaded', () => {
    const issue = buildRecentIssue({ vulnerability: 404 });

    expect(describeIssues([issue])[0].name).toBe('404');
  });
});

describe('rankIssues', () => {
  it('orders the issues commonest first', () => {
    const ranked = rankIssues([
      { name: 'Unused Permissions', count: 12, scanTypes: [] },
      { name: 'Insecure Storage', count: 48, scanTypes: [] },
    ]);

    expect(ranked.map((issue) => issue.name)).toEqual(['Insecure Storage', 'Unused Permissions']);
  });

  it('numbers the issues from one', () => {
    const ranked = rankIssues([
      { name: 'Unused Permissions', count: 12, scanTypes: [] },
      { name: 'Insecure Storage', count: 48, scanTypes: [] },
    ]);

    expect(ranked.map((issue) => issue.rank)).toEqual([1, 2]);
  });

  it('leaves the order of what it was given untouched', () => {
    const issues = [
      { name: 'Unused Permissions', count: 12, scanTypes: [] },
      { name: 'Insecure Storage', count: 48, scanTypes: [] },
    ];

    rankIssues(issues);

    expect(issues[0].name).toBe('Unused Permissions');
  });

  it('keeps the scans that find each issue', () => {
    const ranked = rankIssues([{ name: 'Insecure Storage', count: 48, scanTypes: ['Static'] }]);

    expect(ranked[0].scanTypes).toEqual(['Static']);
  });

  it('ranks nothing when there are no issues', () => {
    expect(rankIssues([])).toEqual([]);
  });
});

describe('formatIssueTooltip', () => {
  it('names the issue and how many files carry it', () => {
    const tooltip = formatIssueTooltip({ name: 'Unused Permissions', count: 12, scanTypes: [] });

    expect(tooltip).toContain('Unused Permissions');
    expect(tooltip).toContain('12');
  });

  it('lists the scans that find it', () => {
    const tooltip = formatIssueTooltip({
      name: 'Unused Permissions',
      count: 12,
      scanTypes: [akMT('static'), akMT('api')],
    });

    expect(tooltip).toContain(`${akMT('static')}, ${akMT('api')}`);
  });

  it('says nothing of scans for an issue the catalogue lists none for', () => {
    const tooltip = formatIssueTooltip({ name: 'Unused Permissions', count: 12, scanTypes: [] });

    expect(tooltip.endsWith(akMT('files'))).toBe(true);
  });

  it('says nothing for a row drawn from no issue', () => {
    expect(formatIssueTooltip()).toBe('');
  });
});

describe('formatIssueBarLabel', () => {
  it('writes the count and what it counts', () => {
    const label = formatIssueBarLabel({ name: 'Unused Permissions', count: 12, scanTypes: [] });

    expect(label).toBe(`{count|12} {unit|${akMT('files')}}`);
  });

  it('writes a chip for each scan that finds it', () => {
    const label = formatIssueBarLabel({
      name: 'Unused Permissions',
      count: 12,
      scanTypes: [akMT('static'), akMT('api')],
    });

    expect(label).toContain(`{chip|${akMT('static')}} {chip|${akMT('api')}}`);
  });

  it('writes nothing for a bar drawn from no issue', () => {
    expect(formatIssueBarLabel()).toBe('');
  });
});

describe('getIssueAtRow', () => {
  it('answers the issue the row was drawn from', () => {
    const ranked = rankIssues([{ name: 'Insecure Storage', count: 48, scanTypes: [] }]);

    expect(getIssueAtRow(ranked, { dataIndex: 0 })?.name).toBe('Insecure Storage');
  });

  it('answers nothing where the formatter was handed no row', () => {
    expect(getIssueAtRow([])).toBeUndefined();
  });

  it('answers nothing where the row points past the ranking', () => {
    expect(getIssueAtRow([], { dataIndex: 3 })).toBeUndefined();
  });
});
