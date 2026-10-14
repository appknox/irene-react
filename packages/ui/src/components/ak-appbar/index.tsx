import { type VariantProps } from 'class-variance-authority';
import { type ComponentProps } from 'react';

import { cn } from '@irene/ui/cn';

import { akAppbarVariants } from './variants';
import styles from '@irene/ui/ak-appbar/styles.module.css';

type AkAppbarProps = Omit<ComponentProps<'header'>, 'color'> &
  VariantProps<typeof akAppbarVariants> & {
    elevation?: boolean;
  };

/**
 * The bar across the top of a page: the product's own controls, the account's.
 *
 * It renders a `header`, so a screen reader reads it as the page's banner and
 * skips to it. What it holds is the caller's; the bar only places it.
 *
 * @param props.color - Which surface it is drawn on.
 * @param props.position - How it sits in the page, static unless it has to scroll with it.
 * @param props.placement - Which edge a positioned bar is pinned to.
 * @param props.gutter - The bar's own padding, off for a caller that lays its own out.
 * @param props.elevation - Lifts it off the page beneath, for one the page scrolls under.
 */
function AkAppbar({
  color,
  position,
  placement,
  gutter,
  elevation,
  className,
  children,
  ...props
}: AkAppbarProps) {
  return (
    <header
      data-slot="appbar"
      className={cn(
        akAppbarVariants({ color, position, placement, gutter }),
        elevation && styles.elevated,
        className
      )}
      {...props}
    >
      {children}
    </header>
  );
}

export { AkAppbar };
