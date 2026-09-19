import { type VariantProps } from 'class-variance-authority';
import { type ComponentProps } from 'react';

import { akDividerVariants } from '@irene/ui/ak-divider/variants';
import { cn } from '@irene/ui/cn';

/** Props for the `AkDivider` component. */
type AkDividerProps = Omit<ComponentProps<'hr'>, 'color'> & VariantProps<typeof akDividerVariants>;

/**
 * A rule between sections.
 *
 * @param props.direction - horizontal renders an `hr`, vertical a `div`, since an `hr` cannot stand on its side.
 * @param props.color - light for a faint rule, dark for a stronger one.
 * @param props.variant - fullWidth runs edge to edge, middle insets itself.
 */
function AkDivider({ className, direction, color, variant, ...props }: AkDividerProps) {
  const isVertical = direction === 'vertical';
  const Tag = isVertical ? 'div' : 'hr';
  const role = isVertical ? 'separator' : undefined;
  const ariaOrientation = isVertical ? 'vertical' : undefined;

  return (
    <Tag
      data-slot="divider"
      role={role}
      aria-orientation={ariaOrientation}
      className={cn(akDividerVariants({ direction, color, variant }), className)}
      {...props}
    />
  );
}

export { AkDivider };
