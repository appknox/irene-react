import { cva } from 'class-variance-authority';

/*
  A rule between sections. Horizontal renders an `hr`; vertical cannot, so it
  renders a `div` with a left border instead.
*/
export const akDividerVariants = cva('shrink-0 border-solid', {
  variants: {
    direction: {
      horizontal: 'w-full border-x-0 border-t-0 border-b',
      vertical: 'h-full shrink border-y-0 border-r-0 border-l',
    },

    color: {
      light: 'border-divider',
      dark: 'border-divider-strong',
    },

    /** fullWidth runs edge to edge; middle insets itself from the content. */
    variant: {
      fullWidth: 'm-0',
      middle: '',
    },
  },

  compoundVariants: [
    { variant: 'middle', direction: 'horizontal', class: 'mx-4' },
    { variant: 'middle', direction: 'vertical', class: 'my-4 h-4/5' },
  ],

  defaultVariants: {
    direction: 'horizontal',
    color: 'dark',
    variant: 'fullWidth',
  },
});
