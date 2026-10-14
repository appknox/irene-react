import { Link } from '@tanstack/react-router';
import { Fragment } from 'react';

import { AkChip } from '@irene/ui/ak-chip';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';
import type { IconName } from '@irene/ui/icons/sets';

import type { FileRouteTypes } from '@/routeTree.gen';

/** One item a product puts in the navigation. */
export interface SideNavItemDefinition {
  id: string;
  label: string;
  icon: IconName;
  to: FileRouteTypes['to'];
  search?: Record<string, number>;
  badge?: string;
}

/**
 * One navigation item: its icon, its label once there is room, and its count.
 *
 * @param props.item - What it links to and what it is called.
 * @param props.isCollapsed - Whether only the icon is shown.
 * @param props.onClick - What the navigation does when any item is chosen.
 */
export function SideNavItem({
  item,
  isCollapsed,
  onClick,
}: Readonly<{ item: SideNavItemDefinition; isCollapsed: boolean; onClick?: () => void }>) {
  return (
    <li>
      <AkTooltip title={item.label} side="right" disabled={!isCollapsed} arrow>
        <Link
          to={item.to}
          search={item.search}
          onClick={onClick}
          aria-label={item.label}
          className={cn(
            'flex w-full items-center gap-2 px-4 py-2.5 hover:bg-hover-light',
            'group relative text-foreground',
            isCollapsed && 'justify-center',
            'data-[status=active]:bg-primary/10 data-[status=active]:before:absolute',
            'data-[status=active]:before:inset-y-0 data-[status=active]:before:left-0',
            'data-[status=active]:before:w-0.5 data-[status=active]:before:bg-primary'
          )}
          data-test-side-nav-item={item.id}
        >
          <AkIcon name={item.icon} className="size-5 shrink-0 text-foreground" />

          {!isCollapsed && (
            <Fragment>
              <AkTypography
                tag="span"
                variant="body2"
                className="flex-1 truncate group-data-[status=active]:font-semibold"
                title={item.label}
              >
                {item.label}
              </AkTypography>

              {item.badge && (
                <AkChip
                  label={item.badge}
                  variant="filled"
                  size="small"
                  className={cn(
                    'h-4.5 bg-divider-strong font-semibold text-foreground/40',
                    'group-data-[status=active]:bg-primary group-data-[status=active]:text-white'
                  )}
                />
              )}
            </Fragment>
          )}
        </Link>
      </AkTooltip>
    </li>
  );
}
