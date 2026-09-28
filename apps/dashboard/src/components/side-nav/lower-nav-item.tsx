import type { ComponentProps } from 'react';

import { AkIcon } from '@irene/ui/ak-icon';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';
import type { IconName } from '@irene/ui/icons/sets';

interface LowerNavItemProps {
  label: string;
  icon: IconName;
  isCollapsed: boolean;
  onClick?: ComponentProps<'button'>['onClick'];
  id?: string;
  className?: string;
  iconClassName?: string;
}

/**
 * A row below the navigation: chat support, the release, the width control.
 *
 * It acts rather than leads, so it is a button and not a link.
 *
 * @param props.label - What it reads, and what its tooltip says while collapsed.
 * @param props.icon - The mark beside it.
 * @param props.isCollapsed - Whether only the icon is shown.
 * @param props.onClick - What it does.
 * @param props.id - Names the row for a product tour that anchors a badge to it.
 * @param props.className - Classes for the row.
 * @param props.iconClassName - Classes for the mark.
 */
export function LowerNavItem({
  label,
  icon,
  isCollapsed,
  onClick,
  id,
  className,
  iconClassName,
}: Readonly<LowerNavItemProps>) {
  return (
    <li>
      <AkTooltip title={label} side="right" disabled={!isCollapsed} arrow>
        <button
          id={id}
          type="button"
          onClick={onClick}
          aria-label={label}
          className={cn(
            'flex w-full cursor-pointer items-center gap-2 px-4 py-2.5',
            'text-foreground hover:bg-hover-light',
            isCollapsed && 'justify-center',
            className
          )}
          data-test-side-nav-lower-item={label}
        >
          <AkIcon name={icon} className={cn('size-5 shrink-0 text-foreground', iconClassName)} />

          {!isCollapsed && (
            <AkTypography tag="span" variant="body2" className="truncate" noWrap>
              {label}
            </AkTypography>
          )}
        </button>
      </AkTooltip>
    </li>
  );
}
