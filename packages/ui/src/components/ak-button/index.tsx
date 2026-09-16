import { Slot } from 'radix-ui';
import { type VariantProps } from 'class-variance-authority';
import { type ComponentProps } from 'react';

import { AkSpinner } from '@irene/ui/ak-spinner';
import { cn } from '@irene/ui/cn';

import { akButtonVariants } from './variants';

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof akButtonVariants> & {
    asChild?: boolean;
    /** Shows a spinner and blocks clicks while an action runs. */
    loading?: boolean;
  };

/**
 * The button used across the app.
 *
 * @param props.variant - filled for the primary action, outlined for the secondary, text for links.
 * @param props.color - Tints the variant.
 * @param props.loading - Shows a spinner and disables the button.
 * @param props.asChild - Renders the child element instead, e.g. an anchor.
 */
function AkButton({
  className,
  variant = 'filled',
  color = 'primary',
  size = 'default',
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';
  const isBlocked = disabled || loading;

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-color={color}
      data-size={size}
      data-loading={loading || undefined}
      // An anchor or label has no disabled attribute, so it is blocked with a class instead.
      data-disabled={asChild && isBlocked ? '' : undefined}
      disabled={asChild ? undefined : isBlocked}
      aria-disabled={asChild && isBlocked ? true : undefined}
      aria-busy={loading || undefined}
      className={cn(
        akButtonVariants({ variant, color, size, className }),
        asChild && isBlocked && 'pointer-events-none opacity-60'
      )}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <AkSpinner aria-hidden className="size-4" />}
          {children}
        </>
      )}
    </Comp>
  );
}

export { AkButton };
