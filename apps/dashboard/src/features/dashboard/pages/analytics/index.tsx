import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { yearToDateRange } from '@irene/ui/ak-date-range-picker/helpers';
import type { AkDateRange } from '@irene/ui/ak-date-range-picker';

import { useOrganization } from '@/hooks/use-organization';
import { scanCountOptions } from '@/queries/analytics';

import { ScanActivity } from './components/scan-activity';
import { ScanPosture } from './components/scan-posture';
import { TopIssues } from './components/top-issues';

/**
 * What the organization's scanning adds up to, read top to bottom.
 *
 * The page answers three questions in the order they are asked: how much has
 * been scanned and of what kind, when it was scanned, and what it found. Each
 * answer takes the full width, so none of them is cramped into half a row to
 * keep another company.
 */
export function AnalyticsPage() {
  const organizationId = useOrganization().selectedId();
  const { data: scanCount, isPending } = useQuery(scanCountOptions(organizationId));

  /* The span is the page's: the activity chart sets it and every figure over time reads it. */
  const [range, setRange] = useState<AkDateRange>(yearToDateRange);

  return (
    <div className="flex flex-col gap-3 p-4" data-test-analytics-page>
      <ScanPosture scanCount={scanCount} isPending={isPending} />

      <ScanActivity range={range} onRangeChange={setRange} />

      <TopIssues />
    </div>
  );
}
