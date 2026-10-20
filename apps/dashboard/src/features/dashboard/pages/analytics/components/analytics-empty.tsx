import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';

/**
 * What a panel shows when there is nothing to draw.
 * An empty chart reads as a failure, so the panel says what is absent instead.
 *
 * @param props.message - What is missing, in the page's own words.
 */
export function AnalyticsEmpty({ message }: Readonly<{ message: string }>) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center"
      data-test-analytics-empty
    >
      <AkIcon name="material-symbols:show-chart" className="size-9 text-foreground-disabled" />

      <AkTypography variant="body2" color="textSecondary">
        {message}
      </AkTypography>
    </div>
  );
}
