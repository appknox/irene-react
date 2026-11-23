import { cva } from 'class-variance-authority';

/* `color` tints the ring only once it is chosen; an unchosen ring looks the same in every colour. */
export const akRadioVariants = cva(
  `
    peer relative inline-flex size-4 shrink-0 cursor-pointer items-center justify-center
    rounded-full border-2 border-border-strong bg-transparent transition-shadow outline-none
    focus-visible:ring-3 focus-visible:ring-ring/50
    disabled:cursor-not-allowed disabled:border-neutral-400
    disabled:data-[state=checked]:border-neutral-400
  `,
  {
    variants: {
      color: {
        primary: 'data-[state=checked]:border-primary',
        success: 'data-[state=checked]:border-success',
        error: 'data-[state=checked]:border-danger',
      },
    },

    defaultVariants: { color: 'primary' },
  }
);

export const akRadioDotVariants = cva(
  'block size-2 rounded-full group-disabled/radio:bg-neutral-400',
  {
    variants: {
      color: {
        primary: 'bg-primary',
        success: 'bg-success',
        error: 'bg-danger',
      },
    },

    defaultVariants: { color: 'primary' },
  }
);
