import { type VariantProps } from 'class-variance-authority';
import { type ComponentProps } from 'react';

import { akAlertVariants } from '@irene/ui/ak-alert/variants';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { cn } from '@irene/ui/cn';

/** Props for the `AkAlert` component. */
type AkAlertProps = ComponentProps<'div'> &
  VariantProps<typeof akAlertVariants> & {
    onDismiss?: () => void;
    dismissLabel?: string;
  };

/**
 * A message about what just happened, inline on the page or inside a toast.
 *
 * @param props.variant - Which colour the message carries.
 * @param props.onDismiss - Adds a close button that calls this.
 * @param props.dismissLabel - The close button's accessible name.
 */
function AkAlert(props: AkAlertProps) {
  const { className, variant, onDismiss, dismissLabel = 'Close', children, ...rest } = props;

  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(akAlertVariants({ variant }), onDismiss && 'relative', className)}
      {...rest}
    >
      {children}

      {onDismiss && (
        <AkButton
          variant="text"
          size="xs"
          noPadding
          aria-label={dismissLabel}
          className="absolute -top-2 -right-2 cursor-pointer rounded-full border-inherit bg-inherit text-current opacity-80 hover:opacity-100 has-[>svg]:px-1"
          onClick={onDismiss}
          data-slot="alert-dismiss"
        >
          <AkIcon name="mdi:close-circle-outline" className="size-4" />
        </AkButton>
      )}
    </div>
  );
}

function AkAlertTitle({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn('col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight', className)}
      {...props}
    />
  );
}

function AkAlertDescription({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'col-start-2 grid justify-items-start gap-1 text-base opacity-90 [&_p]:leading-relaxed',
        className
      )}
      {...props}
    />
  );
}

export { AkAlert, AkAlertTitle, AkAlertDescription };
