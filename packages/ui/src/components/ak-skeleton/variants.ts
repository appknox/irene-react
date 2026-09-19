import { cva } from 'class-variance-authority';
import styles from '@irene/ui/ak-skeleton/styles.module.css';

/*
  A placeholder that pulses while its content loads. The gradient comes from the design system
  palette; the pulse is scoped to this component, in styles.module.css.
*/
export const akSkeletonVariants = cva(
  `block ${styles.pulse} bg-linear-[306deg,var(--color-neutral-100)_19.42%,var(--color-neutral-200)_81.49%]`,
  {
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
  }
);
