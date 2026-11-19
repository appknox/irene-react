import { cva } from 'class-variance-authority';

/* Colour is the only thing that varies; the size comes from the caller's className. */
export const akSpinnerVariants = cva('size-4 animate-spin', {
  variants: {
    color: {
      inherit: 'text-inherit',
      primary: 'text-primary',
      secondary: 'text-secondary',
      neutral: 'text-foreground-muted',
      textPrimary: 'text-foreground',
      textSecondary: 'text-foreground-muted',
      success: 'text-success',
      error: 'text-danger',
      warn: 'text-warning-strong',
      info: 'text-info',
    },
  },

  defaultVariants: {
    color: 'primary',
  },
});
