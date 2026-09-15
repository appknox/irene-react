import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';

import { akAlertVariants } from '@irene/ui/ak-alert/variants';
import { cn } from '@irene/ui/cn';

function AkAlert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof akAlertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(akAlertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AkAlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn('col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight', className)}
      {...props}
    />
  );
}

function AkAlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'col-start-2 grid justify-items-start gap-1 text-sm text-muted-foreground [&_p]:leading-relaxed',
        className
      )}
      {...props}
    />
  );
}

export { AkAlert, AkAlertTitle, AkAlertDescription };
