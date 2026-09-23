import { cva } from 'class-variance-authority';

/*
  The box itself. `color` tints it only once it is ticked or part-ticked — an
  empty box reads the same whatever it belongs to.

  The tint keys off Radix's own `data-state`, which it sets whether the box is
  controlled or left to manage itself.
*/
export const akCheckboxVariants = cva(
  [
    'peer relative inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-xs border-2 border-border-strong bg-transparent',
    'shadow-xs transition-shadow outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
    'disabled:cursor-not-allowed disabled:border-neutral-400 disabled:bg-transparent',
    /*
      Beats the colour variants, which set the ticked fill: a disabled box is
      neutral-400 whichever colour it was given.
    */
    'disabled:data-[state=checked]:border-neutral-400 disabled:data-[state=checked]:bg-neutral-400',
    'disabled:data-[state=indeterminate]:border-neutral-400 disabled:data-[state=indeterminate]:bg-neutral-400',
    'aria-invalid:border-danger aria-invalid:ring-danger/20',
  ],
  {
    variants: {
      color: {
        primary:
          'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary',
        neutral:
          'data-[state=checked]:border-secondary data-[state=checked]:bg-secondary data-[state=indeterminate]:border-secondary data-[state=indeterminate]:bg-secondary',
        error:
          'data-[state=checked]:border-danger data-[state=checked]:bg-danger data-[state=indeterminate]:border-danger data-[state=indeterminate]:bg-danger',
        success:
          'data-[state=checked]:border-success data-[state=checked]:bg-success data-[state=indeterminate]:border-success data-[state=indeterminate]:bg-success',
        warning:
          'data-[state=checked]:border-warning data-[state=checked]:bg-warning data-[state=indeterminate]:border-warning data-[state=indeterminate]:bg-warning',
        info: 'data-[state=checked]:border-info data-[state=checked]:bg-info data-[state=indeterminate]:border-info data-[state=indeterminate]:bg-info',
      },
    },

    defaultVariants: {
      color: 'primary',
    },
  }
);
