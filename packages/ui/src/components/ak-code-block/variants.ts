import { cva } from 'class-variance-authority';

/*
  A block of code to read or copy: light sits on a page as a tinted panel, dark
  is the terminal look, black with white text.
*/
export const akCodeBlockVariants = cva('flex items-start gap-1.75 rounded-sm', {
  variants: {
    variant: {
      light: 'bg-background-subtle text-foreground',
      dark: 'bg-black text-white',
    },
  },

  defaultVariants: { variant: 'light' },
});

/* The copy control takes the block's text colour, and a hover that shows on either ground. */
export const akCodeBlockCopyVariants = cva('mt-1.75 mr-1.75 text-inherit', {
  variants: {
    variant: {
      light: 'hover:bg-hover-light',
      dark: 'hover:bg-white/15',
    },
  },

  defaultVariants: { variant: 'light' },
});
