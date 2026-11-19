import { Slot } from 'radix-ui';
import { Children, type ComponentProps, type ReactNode } from 'react';

import { cn } from '@irene/ui/cn';

type AkBreadcrumbsProps = ComponentProps<'nav'> & {
  children: ReactNode;
  separator?: ReactNode;
};

/**
 * The trail from a section's root to the page on screen. Unlike irene's
 * `AutoTrail`, each page states its own trail, so it never depends on how the user arrived.
 *
 * @param props.children - The steps, each an `AkBreadcrumbsItem`.
 */
function AkBreadcrumbs({
  children,
  separator = '/',
  className,
  ...props
}: Readonly<AkBreadcrumbsProps>) {
  const steps = Children.toArray(children);

  return (
    <nav data-slot="breadcrumbs" className={cn('flex', className)} {...props}>
      <ol className="flex flex-wrap items-center gap-2">
        {steps.map((step, index) => (
          <li key={index} className="flex items-center gap-2 text-sm text-foreground-muted">
            {step}

            {index < steps.length - 1 && (
              <span aria-hidden="true" data-slot="breadcrumbs-separator">
                {separator}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

type AkBreadcrumbsItemProps = ComponentProps<'span'> & {
  asChild?: boolean;
  current?: boolean;
};

/**
 * One step of an `AkBreadcrumbs` trail.
 *
 * @param props.asChild - Makes the child the step; pass a router link.
 * @param props.current - Marks the page on screen with `aria-current`; give it text rather than a link.
 */
function AkBreadcrumbsItem({
  asChild = false,
  current = false,
  className,
  ...props
}: Readonly<AkBreadcrumbsItemProps>) {
  const Component = asChild ? Slot.Root : 'span';

  return (
    <Component
      data-slot="breadcrumbs-item"
      aria-current={current ? 'page' : undefined}
      className={cn(
        current ? 'text-foreground' : 'text-foreground-muted hover:text-foreground hover:underline',
        className
      )}
      {...props}
    />
  );
}

export { AkBreadcrumbs, AkBreadcrumbsItem };
