import { cva } from 'class-variance-authority';
import styles from '@irene/ui/ak-skeleton/styles.module.css';

/*
  A placeholder that pulses while its content loads. The gradient comes from the design system
  palette; both it and the pulse are scoped to this component, in styles.module.css.
*/
/* The default size is a class rather than an inline style, so a caller's own class can win. */
export const akSkeletonVariants = cva(`block h-[1.2rem] w-full ${styles.pulse}`, {
  variants: {
    variant: {
      rectangular: '',
      rounded: 'rounded-sm',
      circular: 'rounded-full',
    },
  },

  defaultVariants: {
    variant: 'rounded',
  },
});
