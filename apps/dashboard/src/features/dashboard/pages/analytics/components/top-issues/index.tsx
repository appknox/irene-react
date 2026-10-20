import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkChart, type AkChartOption } from '@irene/ui/ak-chart';

import { useOrganization } from '@/hooks/use-organization';
import { recentIssuesOptions } from '@/queries/analytics';
import { vulnerabilitiesOptions } from '@/queries/vulnerability';

import {
  getChartColours,
  getChartFontFamily,
  getColourAtOpacity,
  getFadingBarFill,
} from './chart-colours';

import {
  describeIssues,
  formatIssueBarLabel,
  formatIssueTooltip,
  getIssueAtRow,
  rankIssues,
  type RankedIssue,
} from './describe-issues';

import { AnalyticsCard } from '../analytics-card';
import { AnalyticsEmpty } from '../analytics-empty';
import { IssuesSkeleton } from '../analytics-skeletons';

/** What a label or tooltip formatter is handed about the row it is drawing. */
interface ChartRowParams {
  dataIndex: number;
}

/** How much of the brand colour each place down the ranking keeps. */
const FADE_PER_PLACE = 0.08;

/** How faint the ranking is allowed to get, so the last bar is still a bar. */
const FAINTEST = 0.35;

/** How long a name may run before it is cut short. */
const LONGEST_LABEL = 40;

/** How much of the card the names may take, after which the axis ellipses them. */
const LABEL_WIDTH = 320;

/** A name as the axis shows it, cut short where it runs past what the axis holds. */
const axisLabel = (name: string) =>
  name.length > LONGEST_LABEL ? `${name.slice(0, LONGEST_LABEL)}…` : name;

/**
 * The vulnerabilities found in the most files, the commonest first.
 *
 * Bars running left to right, one hue fading down the ranking and each bar
 * fading out towards its own tip, so the order is read before any number is.
 * The endpoint answers ids and counts alone, so the names and the kinds of
 * scan that find them come from the vulnerability catalogue the session
 * already holds.
 */
export function TopIssues() {
  const organizationId = useOrganization().selectedId();
  const { data: issues, isPending } = useQuery(recentIssuesOptions(organizationId));
  const { data: vulnerabilities } = useQuery(vulnerabilitiesOptions());

  const rankedIssues = useMemo(
    () => rankIssues(describeIssues(issues?.items ?? [], vulnerabilities)),
    [issues, vulnerabilities]
  );

  const chartOptions = useMemo<AkChartOption>(() => {
    const colours = getChartColours();

    const getIssueColour = ({ rank }: RankedIssue) =>
      getColourAtOpacity(colours.primary, Math.max(1 - (rank - 1) * FADE_PER_PLACE, FAINTEST));

    return {
      textStyle: { fontFamily: getChartFontFamily(), color: colours.muted },

      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        borderWidth: 0,
        backgroundColor: colours.foreground,
        textStyle: { color: colours.background, fontFamily: getChartFontFamily() },
        formatter: (rows: ChartRowParams[]) =>
          formatIssueTooltip(getIssueAtRow(rankedIssues, rows[0])),
      },

      grid: { left: 0, right: 120, top: 0, bottom: 0, containLabel: true },

      xAxis: {
        type: 'value',
        axisLabel: { show: false },
        axisLine: { show: false },
        splitLine: { show: false },
      },

      yAxis: {
        type: 'category',
        inverse: true,
        data: rankedIssues.map((issue) => issue.name),
        axisLabel: {
          color: colours.muted,
          formatter: axisLabel,
          width: LABEL_WIDTH,
          overflow: 'truncate',
          fontSize: 12,
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },

      series: [
        {
          type: 'bar',
          barMaxWidth: 20,
          barCategoryGap: '42%',
          label: {
            show: true,
            position: 'right',

            formatter: (row: ChartRowParams) =>
              formatIssueBarLabel(getIssueAtRow(rankedIssues, row)),

            rich: {
              count: {
                color: colours.foreground,
                fontFamily: getChartFontFamily(),
                fontWeight: 'bold',
                fontSize: 13,
              },
              unit: { color: colours.muted, fontFamily: getChartFontFamily(), fontSize: 11 },
              chip: {
                color: colours.muted,
                fontFamily: getChartFontFamily(),
                fontSize: 10,
                lineHeight: 14,
                padding: [3, 6],
                borderColor: colours.border,
                borderWidth: 1,
                borderRadius: 4,
              },
            },
          },

          data: rankedIssues.map((issue) => ({
            value: issue.count,
            itemStyle: {
              color: getFadingBarFill(getIssueColour(issue)),
              borderRadius: [0, 3, 3, 0],
            },
          })),
        },
      ],
    };
  }, [rankedIssues]);

  return (
    <AnalyticsCard title={akMT('analyticsModule.mostFoundIssues')}>
      {isPending && <IssuesSkeleton />}

      {!isPending && rankedIssues.length > 0 && (
        <AkChart
          option={chartOptions}
          ariaLabel={akMT('analyticsModule.mostFoundIssues')}
          className="h-96"
        />
      )}

      {!isPending && rankedIssues.length === 0 && (
        <AnalyticsEmpty message={akMT('analyticsModule.noIssuesFound')} />
      )}
    </AnalyticsCard>
  );
}
