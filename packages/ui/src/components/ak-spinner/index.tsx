import type { ComponentProps } from 'react';

import { AkIcon } from '@irene/ui/ak-icon';
import { cn } from '@irene/ui/cn';

/**
 * The spinner shown while something is loading. Colour follows `currentColor`.
 *
 * @param props.className - Sets the size, defaulting to the text size.
 */
function AkSpinner({ className, ...props }: Omit<ComponentProps<typeof AkIcon>, 'name'>) {
  return (
    <AkIcon
      name="lucide:loader-circle"
      role="status"
      aria-label="Loading"
      aria-hidden={false}
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  );
}

export { AkSpinner };
