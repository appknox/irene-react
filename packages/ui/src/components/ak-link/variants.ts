import { cva } from 'class-variance-authority';

/*
  Colour and underline are separate axes, as in the design system: `color` sets
  the text colour, `underline` when the line is drawn.
*/
export const akLinkVariants = cva(
  [
    'inline items-center gap-1 rounded-xs transition-colors',
    'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
    'aria-disabled:pointer-events-none aria-disabled:text-foreground-disabled',
  ],
  {
    variants: {
      color: {
        primary: 'text-primary hover:text-primary-hover',
        secondary: 'text-secondary',
        error: 'text-danger',
        success: 'text-success',
        warning: 'text-warning',
        textPrimary: 'text-foreground',
        textSecondary: 'text-foreground-muted',
        inherit: 'text-inherit',
      },

      underline: {
        always: 'underline',
        hover: 'no-underline hover:underline',
        none: 'no-underline',
      },
    },

    defaultVariants: {
      color: 'primary',
      underline: 'always',
    },
  }
);
