import { Slot } from 'radix-ui';
import { type VariantProps } from 'class-variance-authority';
import { type ComponentProps } from 'react';

import { akLinkVariants } from '@irene/ui/ak-link/variants';
import { cn } from '@irene/ui/cn';

type AkLinkProps = ComponentProps<'a'> &
  VariantProps<typeof akLinkVariants> & {
    asChild?: boolean;
  };

/**
 * An anchor styled by the design system.
 *
 * `asChild` renders the props onto the single child instead of an `<a>`, for a
 * router `Link`, which needs to own the element to handle navigation itself.
 *
 * @param props.color - The text colour.
 * @param props.underline - Whether the underline is always drawn, drawn on hover, or never.
 * @param props.asChild - Render onto the child element rather than an anchor.
 * @param props.className - Classes for the link.
 */
function AkLink({ className, color, underline, asChild, ...props }: AkLinkProps) {
  const Component = asChild ? Slot.Root : 'a';

  return (
    <Component
      data-slot="link"
      className={cn(akLinkVariants({ color, underline }), className)}
      {...props}
    />
  );
}

export { AkLink };
