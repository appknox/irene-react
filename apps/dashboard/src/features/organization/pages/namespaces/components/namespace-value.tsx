import { ENUMS } from '@irene/enums';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';
import type { IconName } from '@irene/ui/icons/sets';

/*
  The platforms a namespace can be claimed for. Android and iOS carry the
  colours they are known by, as irene gives them; anything else reads as a
  generic device in the surrounding text colour.
*/
const PLATFORMS: Partial<Record<number, { icon: IconName; className: string }>> = {
  [ENUMS.PLATFORM.ANDROID]: { icon: 'material-symbols:android', className: 'text-android' },
  [ENUMS.PLATFORM.IOS]: { icon: 'fa-brands:apple', className: 'text-ios' },
  [ENUMS.PLATFORM.WINDOWS]: {
    icon: 'material-symbols:desktop-windows',
    className: 'text-foreground-muted',
  },
};

const UNKNOWN_PLATFORM = {
  icon: 'bx:mobile-alt',
  className: 'text-foreground-muted',
} as const;

interface NamespaceValueProps {
  value: string;
  platform: number;
}

/**
 * The namespace itself, under the icon of the platform it was claimed for.
 *
 * @param props.value - The namespace, such as `com.example.app`.
 * @param props.platform - Which platform it belongs to.
 */
export function NamespaceValue({ value, platform }: Readonly<NamespaceValueProps>) {
  return (
    <div className="flex items-center gap-3.5">
      <AkIcon
        name={(PLATFORMS[platform] ?? UNKNOWN_PLATFORM).icon}
        className={cn('size-5 shrink-0', (PLATFORMS[platform] ?? UNKNOWN_PLATFORM).className)}
        aria-hidden
      />

      <AkTypography tag="span" noWrap title={value} data-test-namespace-value>
        {value}
      </AkTypography>
    </div>
  );
}
