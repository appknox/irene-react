import { Icon } from '@iconify/react';

import { cn } from '@irene/ui/cn';
import type { IconName } from '@irene/ui/icons/sets';

import '@irene/ui/icons/register';

type AkIconProps = Omit<React.ComponentProps<typeof Icon>, 'icon'> & {
  name: IconName;
  size?: string;
};

/**
 * Renders an icon from the bundled Iconify sets.
 * Colour follows `currentColor`, so a text colour on a parent tints the icon.
 */
function AkIcon({ name, size = '1em', className, ...props }: AkIconProps) {
  return (
    <Icon
      icon={name}
      width={size}
      height={size}
      className={cn('inline-block shrink-0 align-[-0.125em]', className)}
      aria-hidden
      {...props}
    />
  );
}

export { AkIcon };
export type { AkIconProps };
