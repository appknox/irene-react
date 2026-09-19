import { Slot } from 'radix-ui';
import { Fragment, type ComponentProps } from 'react';
import { type VariantProps } from 'class-variance-authority';

import { AkSpinner } from '@irene/ui/ak-spinner';
import { cn } from '@irene/ui/cn';

import { akButtonVariants } from './variants';

type AkButtonProps = ComponentProps<'button'> &
  VariantProps<typeof akButtonVariants> & {
    asChild?: boolean;
    loading?: boolean;
    noPadding?: boolean;
  };

/**
 * The button used across the app.
 *
 * @param props.variant - filled for the primary action, outlined for the secondary, text for links.
 * @param props.color - Tints the variant.
 * @param props.loading - Shows a spinner and disables the button.
 * @param props.asChild - Renders the child element instead, e.g. an anchor.
 * @param props.noPadding - Drops the padding so the label lines up with surrounding text.
 */
function AkButton({
  className,
  variant = 'filled',
  color = 'primary',
  size = 'default',
  asChild = false,
  loading = false,
  noPadding = false,
  disabled,
  children,
  ...props
}: AkButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';
  const isBlocked = disabled || loading;

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-color={color}
      data-size={size}
      data-loading={loading || undefined}
      data-disabled={asChild && isBlocked ? '' : undefined}
      disabled={asChild ? undefined : isBlocked}
      aria-disabled={asChild && isBlocked ? true : undefined}
      aria-busy={loading || undefined}
      className={cn(
        akButtonVariants({ variant, color, size }),
        asChild && isBlocked && 'pointer-events-none opacity-60',
        noPadding && 'p-0',
        className
      )}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <Fragment>
          {loading && <AkSpinner aria-hidden className="size-4" />}
          {children}
        </Fragment>
      )}
    </Comp>
  );
}

export { AkButton };
