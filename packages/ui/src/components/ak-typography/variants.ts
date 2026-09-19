import { cva } from 'class-variance-authority';

/*
  The design system's type scale. Each variant fixes a size and a weight, both
  of which a caller can override with a class.
*/
export const akTypographyVariants = cva('m-0 p-0', {
  variants: {
    variant: {
      h1: 'text-5xl font-normal',
      h2: 'text-4xl font-normal',
      h3: 'text-3xl font-bold',
      h4: 'text-2xl font-medium',
      h5: 'text-lg font-bold',
      h6: 'text-base font-medium',
      subtitle1: 'text-base font-bold',
      subtitle2: 'text-md font-medium',
      body1: 'text-base font-normal',
      body2: 'text-md font-normal',
      body3: 'text-2xs leading-none font-normal',
    },

    color: {
      inherit: 'text-inherit',
      textPrimary: 'text-foreground',
      textSecondary: 'text-foreground-muted',
      neutral: 'text-foreground-muted',
      primary: 'text-primary',
      secondary: 'text-secondary',
      success: 'text-success',
      error: 'text-danger',
      warn: 'text-warning-strong',
      info: 'text-info',
    },

    fontWeight: {
      light: 'font-light',
      regular: 'font-normal',
      medium: 'font-medium',
      bold: 'font-bold',
    },

    align: {
      inherit: 'text-inherit',
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify',
    },

    underline: {
      none: 'no-underline',
      always: 'underline',
      hover: 'no-underline hover:underline',
    },

    /** Clips to one line with an ellipsis. */
    noWrap: { true: 'truncate' },
    /** Lets a long unbroken string wrap instead of overflowing. */
    breakWord: { true: 'max-w-full min-w-0 wrap-anywhere' },
    gutterBottom: { true: 'mb-2' },
  },

  defaultVariants: {
    variant: 'body1',
    color: 'inherit',
  },
});
