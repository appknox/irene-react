import { cva } from 'class-variance-authority';

/*
  The bar across the top of a page. It states its own position, since a fixed
  or sticky bar needs its placement edges set with it.
*/
export const akAppbarVariants = cva('flex w-full items-center', {
  variants: {
    color: {
      default: 'border-b border-border bg-background text-foreground',
      light: 'border-b border-border bg-background-subtle text-foreground',
      dark: 'bg-background-inverse text-white',
    },

    position: {
      static: 'static',
      relative: 'relative',
      absolute: 'absolute',
      fixed: 'fixed',
      sticky: 'sticky',
    },

    placement: {
      top: 'top-0 right-0 left-0',
      bottom: 'right-0 bottom-0 left-0',
    },

    /** The bar's own padding, which a caller lays out its own way without. */
    gutter: {
      true: 'px-3.5 py-2.75',
      false: '',
    },
  },

  compoundVariants: [
    /* Only a positioned bar takes edges; a static one would be pinned to the viewport. */
    { position: 'static', class: 'top-auto right-auto bottom-auto left-auto' },
  ],

  defaultVariants: {
    color: 'default',
    position: 'static',
    placement: 'top',
    gutter: true,
  },
});
