import { type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { AkIcon } from '@irene/ui/ak-icon';
import { cn } from '@irene/ui/cn';

import { akSpinnerVariants } from './variants';

type AkSpinnerProps = Omit<ComponentProps<typeof AkIcon>, 'name' | 'color'> &
  VariantProps<typeof akSpinnerVariants>;

/**
 * The spinner shown while something is loading.
 *
 * @param props.color - Which colour it spins in. `inherit` takes the surrounding text's.
 * @param props.className - Sets the size, defaulting to the text size.
 */
function AkSpinner({ color, className, ...props }: Readonly<AkSpinnerProps>) {
  return (
    <AkIcon
      name="lucide:loader-circle"
      role="status"
      aria-label="Loading"
      aria-hidden={false}
      className={cn(akSpinnerVariants({ color }), className)}
      {...props}
    />
  );
}

export { AkSpinner };
