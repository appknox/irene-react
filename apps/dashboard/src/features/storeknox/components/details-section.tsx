import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@irene/ui/cn';

interface DetailsSectionHeaderProps extends ComponentProps<'div'> {
  color?: 'default' | 'white';
  icon?: ReactNode;
}

/**
 * The bar a details section opens with.
 *
 * @param props.color - `white` to sit on the page's white header.
 */
export function DetailsSectionHeader({
  color = 'default',
  icon,
  className,
  children,
  ...props
}: Readonly<DetailsSectionHeaderProps>) {
  return (
    <div
      className={cn(
        'flex w-full items-center gap-3 border border-border px-6 py-2',
        color === 'white' ? 'bg-background' : 'bg-background-subtle',
        className
      )}
      {...props}
    >
      {icon}

      {children}
    </div>
  );
}

/** The body under a `DetailsSectionHeader`. */
export function DetailsSectionInfo({ className, ...props }: Readonly<ComponentProps<'div'>>) {
  return (
    <div
      className={cn('flex w-full border border-t-0 border-border bg-background p-6', className)}
      {...props}
    />
  );
}
