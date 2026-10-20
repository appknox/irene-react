import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';
import type { ApiRecentIssue } from '@irene/api/services/analytics';
import type { ApiVulnerability } from '@irene/api/services/vulnerability';

/** One vulnerability as the chart draws it: named, counted and described. */
interface DescribedIssue {
  count: number;
  name: string;
  scanTypes: string[];
}

/** One vulnerability in the ranking, by how many files carry it. */
export interface RankedIssue extends DescribedIssue {
  rank: number;
}

/** What each kind of scan is called, by the number the catalogue uses. */
const SCAN_TYPE_LABELS: Record<number, string> = {
  [ENUMS.VULNERABILITY_TYPE.STATIC]: akMT('static'),
  [ENUMS.VULNERABILITY_TYPE.DYNAMIC]: akMT('dynamic'),
  [ENUMS.VULNERABILITY_TYPE.MANUAL]: akMT('manual'),
  [ENUMS.VULNERABILITY_TYPE.API]: akMT('api'),
};

/**
 * Names the vulnerabilities the analytics endpoint answers with ids alone.
 *
 * The catalogue is already in the session, so it is read rather than fetched
 * per issue. A vulnerability the catalogue does not carry keeps its id as its
 * name, which is visible rather than silently blank.
 *
 * @param issues - What the endpoint answered: ids and counts.
 * @param vulnerabilities - The catalogue, absent until it has loaded.
 * @returns One entry per issue, named and with the scans that find it.
 */
export function describeIssues(
  issues: ApiRecentIssue[],
  vulnerabilities?: ApiVulnerability[]
): DescribedIssue[] {
  return issues.map((issue) => {
    const vulnerability = vulnerabilities?.find(({ id }) => id === issue.vulnerability);

    return {
      count: issue.count,
      name: vulnerability?.name ?? String(issue.vulnerability),
      scanTypes: (vulnerability?.types ?? []).map((type) => SCAN_TYPE_LABELS[type] ?? String(type)),
    };
  });
}

/**
 * Orders the issues commonest first.
 *
 * @param issues - The issues, named and counted, in any order.
 * @returns The issues, commonest first, each with its place in the ranking.
 */
export function rankIssues(issues: DescribedIssue[]): RankedIssue[] {
  const commonestFirst = [...issues].sort((one, other) => other.count - one.count);

  return commonestFirst.map((issue, index) => ({ ...issue, rank: index + 1 }));
}

/**
 * What the chart says about one bar when its row is pointed at.
 *
 * The axis truncates a long name, so the tooltip is where the whole of it is
 * read back.
 *
 * @param issue - The issue the row was drawn from, absent for a row with none.
 * @returns The tooltip's markup, or nothing where there is no issue to describe.
 */
export const formatIssueTooltip = (issue?: DescribedIssue) => {
  if (!issue) {
    return '';
  }

  const scanTypes = issue.scanTypes.length > 0 ? `<br/>${issue.scanTypes.join(', ')}` : '';

  return `<strong>${issue.name}</strong><br/>${issue.count} ${akMT('files')}${scanTypes}`;
};

/**
 * What the chart writes at the end of one bar: the count, its unit, and the scans.
 *
 * The parts are named for the rich-text styles the chart draws them in, which
 * is how a canvas is given a chip rather than a run of text.
 *
 * @param issue - The issue the bar was drawn from, absent for a bar with none.
 * @returns The label's rich-text markup, or nothing where there is no issue.
 */
export const formatIssueBarLabel = (issue?: DescribedIssue) => {
  if (!issue) {
    return '';
  }

  return [
    `{count|${issue.count}}`,
    `{unit|${akMT('files')}}`,
    ...issue.scanTypes.map((scanType) => `{chip|${scanType}}`),
  ].join(' ');
};

/**
 * The issue a chart row was drawn from, which a formatter is handed only the index of.
 *
 * @param issues - The issues, in the order the chart drew them.
 * @param row - What the formatter was handed, absent where it was handed nothing.
 * @returns The issue, or nothing where the row points past the ranking.
 */
export const getIssueAtRow = (issues: RankedIssue[], row?: { dataIndex: number }) =>
  row ? issues[row.dataIndex] : undefined;
