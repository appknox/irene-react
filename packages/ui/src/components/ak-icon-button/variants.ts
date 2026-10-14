import { cva } from 'class-variance-authority';

/*
  A control that is only an icon: transparent by default, outlined where it has
  to read as a control of its own. The hover outline is drawn as an inset
  shadow so the border thickens without the button changing size.
*/
export const akIconButtonVariants = cva(
  [
    'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-sm bg-transparent',
    'align-middle text-foreground transition-colors outline-none select-none',
    'focus-visible:ring-3 focus-visible:ring-ring/50',
    'disabled:pointer-events-none disabled:cursor-default disabled:bg-transparent',
    'disabled:text-foreground-disabled',
  ],
  {
    variants: {
      variant: {
        default: 'hover:bg-hover-light',
        outlined: 'border disabled:border-border-strong',
      },
      borderColor: {
        default: '',
        primary: '',
        secondary: '',
      },
      size: {
        small: 'p-1.25 [&_svg]:size-4.5',
        medium: 'p-1.5 [&_svg]:size-5',
      },
    },

    compoundVariants: [
      {
        variant: 'outlined',
        borderColor: 'default',
        class: `
          border-border-strong
          hover:shadow-[inset_0_0_0_0.5px_var(--color-border-strong)] hover:bg-transparent
        `,
      },
      {
        variant: 'outlined',
        borderColor: 'primary',
        class: `
          border-primary
          hover:shadow-[inset_0_0_0_0.5px_var(--color-primary)] hover:bg-transparent
        `,
      },
      {
        variant: 'outlined',
        borderColor: 'secondary',
        class: `
          border-secondary
          hover:shadow-[inset_0_0_0_0.5px_var(--color-secondary)] hover:bg-transparent
        `,
      },
    ],

    defaultVariants: { variant: 'default', borderColor: 'default', size: 'medium' },
  }
);
