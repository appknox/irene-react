import { cva } from 'class-variance-authority';

/*
  The track. Green when on and grey when off, as irene's is, at irene's three
  heights; each is twice as wide as it is tall.
*/
export const akToggleVariants = cva(
  `
    peer group/toggle inline-flex shrink-0 cursor-pointer items-center rounded-full
    transition-colors outline-none
    focus-visible:ring-3 focus-visible:ring-ring/50
    disabled:cursor-not-allowed disabled:opacity-50
    data-[state=checked]:bg-success
    data-[state=unchecked]:bg-neutral-300
  `,
  {
    variants: {
      size: {
        small: 'h-4 w-8 p-0.5',
        default: 'h-6 w-12 p-0.5',
        large: 'h-7.5 w-15 p-0.75',
      },
    },

    defaultVariants: { size: 'default' },
  }
);

/* The knob, which travels the width of the track less its own width and the padding. */
export const akToggleThumbVariants = cva(
  `
    pointer-events-none block rounded-full bg-background shadow-15 transition-transform
    data-[state=unchecked]:translate-x-0
  `,
  {
    variants: {
      size: {
        small: 'size-3 data-[state=checked]:translate-x-4',
        default: 'size-5 data-[state=checked]:translate-x-6',
        large: 'size-6 data-[state=checked]:translate-x-7.5',
      },
    },

    defaultVariants: { size: 'default' },
  }
);
