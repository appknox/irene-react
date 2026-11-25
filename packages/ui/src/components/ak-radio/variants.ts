import { cva } from 'class-variance-authority';

/*
  The ring itself, drawn in the text colour around it so an unselected button
  reads as part of the label it belongs to rather than as something greyed out.
  The tint keys off Radix's own `data-state`, so it applies whether the group
  is controlled or left to manage itself.
*/
export const akRadioVariants = cva(
  [
    'peer relative inline-flex size-4 shrink-0 cursor-pointer items-center justify-center',
    'rounded-full border-2 border-current bg-transparent',
    'transition-shadow outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
    'disabled:cursor-not-allowed disabled:border-neutral-400',
  ],
  {
    variants: {
      color: {
        primary: 'data-[state=checked]:border-primary data-[state=checked]:text-primary',
        neutral: 'data-[state=checked]:border-secondary data-[state=checked]:text-secondary',
      },
    },

    defaultVariants: { color: 'primary' },
  }
);
