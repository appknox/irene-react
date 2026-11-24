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
 * This is the plain anchor, for an address the application's router does not
 * own: another site, a download, a file served by the API, or anything opened
 * in a new tab. For somewhere inside the application, use `AkRouterLink`,
 * which navigates without loading the application again.
 *
 * A link opened in a new tab is given `rel="noopener noreferrer"` unless it
 * sets its own `rel`, so the page it opens cannot reach back through
 * `window.opener` and the address it came from is not passed on.
 *
 * `asChild` renders the props onto the single child instead of an `<a>`, for a
 * component that needs to own the element itself.
 *
 * @param props.color - The text colour.
 * @param props.underline - Whether the underline is always drawn, drawn on hover, or never.
 * @param props.asChild - Render onto the child element rather than an anchor.
 * @param props.className - Classes for the link.
 */
function AkLink({ className, color, underline, asChild, target, rel, ...props }: AkLinkProps) {
  const Component = asChild ? Slot.Root : 'a';

  return (
    <Component
      data-slot="link"
      className={cn(akLinkVariants({ color, underline }), className)}
      target={target}
      rel={rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined)}
      {...props}
    />
  );
}

export { AkLink };
