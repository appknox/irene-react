import { Slot } from 'radix-ui';
import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';

import { cn } from '@irene/ui/cn';

import { akButtonVariants } from './variants';

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof akButtonVariants> & {
    asChild?: boolean;
  };

function AkButton({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(akButtonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { AkButton };
