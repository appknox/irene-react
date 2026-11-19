import { useId } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkSpinner } from '@irene/ui/ak-spinner';
import { AkToggle } from '@irene/ui/ak-toggle';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { AkTypography } from '@irene/ui/ak-typography';

interface SettingsItemProps {
  title: string;
  description: string;
  isEnabled: boolean;
  isLocked: boolean;
  isLoading: boolean;
  onToggle: (isEnabled: boolean) => void;
}

/**
 * One email preference: what it sends, and the toggle that turns it on.
 *
 * A locked preference is one the VA notification overrides. Its toggle is
 * disabled and explains why on hover; the tooltip hangs on a wrapper, since a
 * disabled button takes no pointer events of its own.
 *
 * @param props.title - What it sends.
 * @param props.description - When it sends it.
 * @param props.isEnabled - Whether it is on.
 * @param props.isLocked - Whether the VA notification overrides it.
 * @param props.isLoading - Whether a request is under way, which holds the toggle.
 * @param props.onToggle - Called with the new state.
 */
export function SettingsItem({
  title,
  description,
  isEnabled,
  isLocked,
  isLoading,
  onToggle,
}: Readonly<SettingsItemProps>) {
  const descriptionId = useId();

  return (
    <div className="flex w-full items-center gap-3.5" data-test-notification-setting>
      <div className="flex w-full flex-col gap-0.5">
        <AkTypography fontWeight="medium">{title}</AkTypography>

        <AkTypography variant="body2" color="textSecondary" id={descriptionId}>
          {description}
        </AkTypography>
      </div>

      <div className="flex shrink-0 items-center gap-1.75">
        {isLoading && <AkSpinner color="neutral" />}

        <AkTooltip
          disabled={!isLocked}
          arrow
          className="max-w-85 whitespace-normal"
          title={akMT('accountNotifSettings.individualScanAllVaEnabledTooltipText')}
        >
          <span className="inline-flex">
            <AkToggle
              size="small"
              checked={isEnabled}
              disabled={isLocked || isLoading}
              onCheckedChange={onToggle}
              aria-label={title}
              aria-describedby={descriptionId}
            />
          </span>
        </AkTooltip>
      </div>
    </div>
  );
}
