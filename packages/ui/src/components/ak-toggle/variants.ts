import { cva } from 'class-variance-authority';

/*
  The track the thumb slides along. Green once on, grey while off, as irene has
  it, and half-faded when it cannot be moved.

  Each size is twice as wide as it is tall, so the thumb — as tall as the track
  leaves it — is round, and the distance it travels is the track's own height.
*/
export const akToggleVariants = cva(
  [
    'peer inline-flex shrink-0 cursor-pointer items-center rounded-full',
    'transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
    'bg-neutral-300 data-[state=checked]:bg-success',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  {
    variants: {
      /** irene's three, from its own track height of 1.6875em. */
      size: {
        small: 'h-4.75 w-9.5 p-0.5',
        default: 'h-6.75 w-13.5 p-0.75',
        large: 'h-8.75 w-17.5 p-1',
      },
    },

    defaultVariants: {
      size: 'default',
    },
  }
);

/** The thumb, as tall as the padded track and moved by the track's height when on. */
export const akToggleThumbVariants = cva(
  [
    'pointer-events-none block aspect-square h-full rounded-full bg-background',
    'transition-transform data-[state=unchecked]:translate-x-0',
  ],
  {
    variants: {
      size: {
        small: 'data-[state=checked]:translate-x-4.75',
        default: 'data-[state=checked]:translate-x-6.75',
        large: 'data-[state=checked]:translate-x-8.75',
      },
    },

    defaultVariants: {
      size: 'default',
    },
  }
);
