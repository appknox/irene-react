import { cva } from 'class-variance-authority';

/**
 * A short, static label: a count beside a navigation item, a state on a row.
 *
 * The root has no padding. The label and the icon space themselves, so a
 * chip holding only a label is the same width as one holding an icon too.
 */
export const akChipVariants = cva(
  [
    'inline-flex max-w-full shrink-0 cursor-default items-center justify-center rounded-sm p-0',
    'align-middle whitespace-nowrap',
  ],
  {
    variants: {
      variant: {
        filled: 'border-0',
        'semi-filled': 'border-0',
        outlined: 'border bg-transparent',
        'semi-filled-outlined': 'border',
      },

      color: {
        default: '',
        primary: '',
        secondary: '',
        success: '',
        error: '',
        warn: '',
        info: '',
      },

      /* The marks scale with the chip, so a small one does not carry a full-size icon. */
      size: {
        small:
          'h-5.5 text-sm **:data-[slot=chip-delete]:size-3.5 **:data-[slot=chip-icon]:size-3.5',
        medium:
          'h-8 text-base **:data-[slot=chip-delete]:size-4.5 **:data-[slot=chip-icon]:size-4.5',
      },

      /** A chip that acts on a click reads and behaves as a control. */
      button: { true: 'cursor-pointer', false: '' },
    },

    compoundVariants: [
      { variant: 'filled', color: 'default', class: 'bg-divider text-foreground' },
      { variant: 'filled', color: 'primary', class: 'bg-primary text-white' },
      { variant: 'filled', color: 'secondary', class: 'bg-secondary text-white' },
      { variant: 'filled', color: 'success', class: 'bg-success text-white' },
      { variant: 'filled', color: 'error', class: 'bg-danger text-white' },
      { variant: 'filled', color: 'warn', class: 'bg-warning text-white' },
      { variant: 'filled', color: 'info', class: 'bg-info text-white' },

      { variant: 'outlined', color: 'default', class: 'border-border-strong text-foreground' },
      { variant: 'outlined', color: 'primary', class: 'border-primary text-primary' },
      { variant: 'outlined', color: 'secondary', class: 'border-secondary text-secondary' },
      { variant: 'outlined', color: 'success', class: 'border-success text-success' },
      { variant: 'outlined', color: 'error', class: 'border-danger text-danger' },
      { variant: 'outlined', color: 'warn', class: 'border-warning text-warning-strong' },
      { variant: 'outlined', color: 'info', class: 'border-info text-info-strong' },

      { variant: 'semi-filled', color: 'default', class: 'bg-divider-strong text-neutral-700' },
      { variant: 'semi-filled', color: 'primary', class: 'bg-primary/20 text-primary-strong' },
      { variant: 'semi-filled', color: 'secondary', class: 'bg-divider-strong text-secondary' },
      { variant: 'semi-filled', color: 'success', class: 'bg-success-surface text-success' },
      { variant: 'semi-filled', color: 'error', class: 'bg-danger-subtle text-danger' },
      { variant: 'semi-filled', color: 'warn', class: 'bg-warning-surface text-warning-strong' },
      { variant: 'semi-filled', color: 'info', class: 'bg-info-surface text-info-strong' },

      /* The border takes the text colour, so the tint reads as one shape. */
      {
        variant: 'semi-filled-outlined',
        color: 'default',
        class: 'border-border bg-divider-strong text-neutral-700',
      },
      {
        variant: 'semi-filled-outlined',
        color: 'primary',
        class: 'border-primary-strong bg-primary/20 text-primary-strong',
      },
      {
        variant: 'semi-filled-outlined',
        color: 'secondary',
        class: 'border-secondary bg-divider-strong text-secondary',
      },
      {
        variant: 'semi-filled-outlined',
        color: 'success',
        class: 'border-success bg-success-surface text-success',
      },
      {
        variant: 'semi-filled-outlined',
        color: 'error',
        class: 'border-danger bg-danger-subtle text-danger',
      },
      {
        variant: 'semi-filled-outlined',
        color: 'warn',
        class: 'border-warning-strong bg-warning-surface text-warning-strong',
      },
      {
        variant: 'semi-filled-outlined',
        color: 'info',
        class: 'border-info-strong bg-info-surface text-info-strong',
      },
    ],

    defaultVariants: { variant: 'outlined', color: 'default', size: 'medium', button: false },
  }
);
