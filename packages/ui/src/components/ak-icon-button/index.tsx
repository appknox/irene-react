import { type VariantProps } from 'class-variance-authority';
import { type ComponentProps } from 'react';

import { cn } from '@irene/ui/cn';

import { akIconButtonVariants } from './variants';

type AkIconButtonProps = Omit<ComponentProps<'button'>, 'color'> &
  VariantProps<typeof akIconButtonVariants>;

/**
 * A control whose whole label is its icon: a close, a refresh, a row action.
 *
 * It carries none of the button's padding or type, so the icon sits in a square
 * of its own. A caller gives it an `aria-label`, since there is no text for a
 * screen reader to read.
 *
 * @param props.variant - Transparent by default, or drawn with a border.
 * @param props.borderColor - Which colour that border takes.
 * @param props.size - The padding, and how large the icon is drawn.
 */
function AkIconButton({
  variant,
  borderColor,
  size,
  type = 'button',
  className,
  children,
  ...props
}: AkIconButtonProps) {
  return (
    <button
      type={type}
      data-slot="icon-button"
      data-variant={variant ?? 'default'}
      data-size={size ?? 'medium'}
      className={cn(akIconButtonVariants({ variant, borderColor, size }), className)}
      {...props}
    >
      {children}
    </button>
  );
}

export { AkIconButton };
