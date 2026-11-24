import { Fragment, type ReactNode } from 'react';

import { cn } from '@irene/ui/cn';

/** One step of the trail. The last one is where the reader is, so it is not a link. */
interface AkBreadcrumb {
  /** What the step is called. */
  title: string;

  /** How to get there, left out for the step the reader is already on. */
  link?: ReactNode;
}

/** Props for the `AkBreadcrumbs` component. */
interface AkBreadcrumbsProps {
  items: AkBreadcrumb[];

  /** What stands between two steps. A slash unless given. */
  separator?: ReactNode;
  className?: string;
}

/**
 * The trail of pages above the one being read.
 *
 * Every step but the last is a link, which the caller passes as the element
 * that navigates — the design system does not know the application's routes.
 * The last step is where the reader is: it carries no link, reads in the
 * primary colour and is the one the page is named by.
 *
 * @param props.items - The steps, outermost first.
 * @param props.separator - What stands between two steps.
 * @param props.className - Classes for the list.
 */
function AkBreadcrumbs({ items, separator = '/', className }: Readonly<AkBreadcrumbsProps>) {
  return (
    <nav aria-label="Breadcrumb" data-slot="breadcrumbs">
      <ol className={cn('flex list-none items-center gap-1', className)}>
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;

          return (
            <li key={item.title} className="flex items-center gap-1 text-md">
              {isCurrent || !item.link ? (
                <span
                  className={cn(
                    'font-medium text-foreground',
                    !isCurrent && 'font-normal text-neutral-500'
                  )}
                  aria-current={isCurrent ? 'page' : undefined}
                  data-test-breadcrumb-item
                >
                  {item.title}
                </span>
              ) : (
                <Fragment>{item.link}</Fragment>
              )}

              {!isCurrent && (
                <span className="text-neutral-500" aria-hidden data-test-breadcrumb-separator>
                  {separator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export { AkBreadcrumbs };
export type { AkBreadcrumb };
