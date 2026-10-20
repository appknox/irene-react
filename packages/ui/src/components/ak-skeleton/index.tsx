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
 * @param props.width - Any CSS width, for a size a class cannot express. Fills
 * its container by default, since a placeholder sized to its own content has
 * nothing to be as wide as.
 * @param props.height - Any CSS height, for a size a class cannot express.
 */
function AkSkeleton({ className, variant, width, height, style, ...props }: AkSkeletonProps) {
  return (
    <span
      data-slot="skeleton"
      aria-hidden
      className={cn(akSkeletonVariants({ variant }), className)}
      style={{ ...(width && { width }), ...(height && { height }), ...style }}
      {...props}
    />
  );
}

export { AkSkeleton };
