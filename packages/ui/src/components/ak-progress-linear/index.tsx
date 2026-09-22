import type { ComponentProps } from 'react';

import { cn } from '@irene/ui/cn';

import styles from './styles.module.css';

/** The bar's maximum value, in percent. */
const PROGRESS_FULL = 100;

/** The bar's minimum value, in percent. */
const PROGRESS_EMPTY = 0;

type AkProgressLinearProps = Omit<ComponentProps<'progress'>, 'children' | 'max'> & {
  value?: number;
  label?: string;
};

/**
 * A horizontal progress bar. Without a value it runs on its own, for a wait
 * whose length nothing knows yet.
 *
 * Built on `<progress>` rather than a div wearing the progressbar role, which
 * is what assistive technology reads reliably across devices.
 *
 * @param props.value - How far along, 0 to 100. Left out, the bar is indeterminate.
 * @param props.label - What is being waited for, read out to assistive technology.
 * @param props.className - Sets the width and the track's height.
 */
function AkProgressLinear({
  value,
  label = 'Loading',
  className,
  ...props
}: AkProgressLinearProps) {
  const isDeterminate = typeof value === 'number';

  const barProgress = isDeterminate
    ? Math.min(PROGRESS_FULL, Math.max(PROGRESS_EMPTY, value))
    : undefined;

  return (
    <progress
      data-slot="progress-linear"
      aria-label={label}
      max={PROGRESS_FULL}
      value={barProgress}
      className={cn(styles.progress, 'h-1.25 w-full rounded-full bg-primary/15', className)}
      {...props}
    />
  );
}

export { AkProgressLinear };
