import { type VariantProps } from 'class-variance-authority';
import { type ComponentProps } from 'react';

import { akSkeletonVariants } from '@irene/ui/ak-skeleton/variants';
import { cn } from '@irene/ui/cn';

/** Props for the `AkSkeleton` component. */
type AkSkeletonProps = ComponentProps<'span'> &
  VariantProps<typeof akSkeletonVariants> & {
    width?: string;
    height?: string;
  };

/**
 * Stands in for content that has not arrived, keeping the layout still.
 *
 * Hidden from screen readers: the surrounding region should say what is
 * loading, rather than every placeholder announcing itself.
 *
 * @param props.variant - rounded for text and fields, circular for avatars, rectangular for images.
 * @param props.width - Any CSS width.
 * @param props.height - Any CSS height.
 */
function AkSkeleton({
  className,
  variant,
  width = 'auto',
  height = '1.2rem',
  style,
  ...props
}: AkSkeletonProps) {
  return (
    <span
      data-slot="skeleton"
      aria-hidden
      className={cn(akSkeletonVariants({ variant }), className)}
      style={{ width, height, ...style }}
      {...props}
    />
  );
}

export { AkSkeleton };
