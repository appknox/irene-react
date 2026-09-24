import { cva } from 'class-variance-authority';

/*
  Three variants, each tinted by `color`: filled for the primary action,
  outlined for the secondary one, text for links.
*/
export const akButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50 cursor-pointer disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // A loading button keeps its colour: it is busy, not unavailable.
        filled:
          'text-white disabled:not-data-loading:bg-disabled-button disabled:not-data-loading:text-white',
        /* Carries the page's own background, so it reads as a control on a tinted section. */
        outlined:
          'border bg-background disabled:not-data-loading:border-border-strong disabled:not-data-loading:text-foreground-disabled',
        text: 'min-w-0 bg-transparent p-0 hover:underline focus-visible:underline disabled:no-underline disabled:not-data-loading:text-foreground-disabled',
      },
      color: {
        primary: '',
        neutral: '',
        error: '',
        success: '',
        warning: '',
        info: '',
        textPrimary: '',
        textSecondary: '',
      },
      size: {
        default: 'h-9 px-4 py-2 text-base has-[>svg]:px-3',
        xs: "h-6 gap-1 px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 gap-1.5 px-3 text-sm has-[>svg]:px-2.5',
        lg: 'h-10 px-6 text-base has-[>svg]:px-4',
        icon: 'size-9',
        'icon-xs': "size-6 [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },

    compoundVariants: [
      { variant: 'filled', color: 'primary', class: 'bg-primary hover:bg-primary-hover' },
      { variant: 'filled', color: 'neutral', class: 'bg-secondary hover:bg-secondary/90' },
      { variant: 'filled', color: 'error', class: 'bg-danger hover:bg-danger/90' },
      { variant: 'filled', color: 'success', class: 'bg-success hover:bg-success/90' },
      { variant: 'filled', color: 'warning', class: 'bg-warning hover:bg-warning/90' },
      { variant: 'filled', color: 'info', class: 'bg-info hover:bg-info/90' },
      {
        variant: 'filled',
        color: ['textPrimary', 'textSecondary'],
        class: 'bg-background-inverse hover:bg-background-inverse/90',
      },

      {
        variant: 'outlined',
        color: 'primary',
        class: 'border-primary text-primary hover:bg-primary/5',
      },
      {
        variant: 'outlined',
        color: ['neutral', 'textPrimary'],
        class: 'border-border-strong text-foreground hover:bg-hover-light',
      },
      { variant: 'outlined', color: 'error', class: 'border-danger text-danger hover:bg-danger/5' },
      {
        variant: 'outlined',
        color: 'success',
        class: 'border-success text-success hover:bg-success/5',
      },
      {
        variant: 'outlined',
        color: 'warning',
        class: 'border-warning text-warning-strong hover:bg-warning/5',
      },
      { variant: 'outlined', color: 'info', class: 'border-info text-info hover:bg-info/5' },
      {
        variant: 'outlined',
        color: 'textSecondary',
        class: 'border-border-strong text-foreground-muted hover:bg-hover-light',
      },

      { variant: 'text', color: 'primary', class: 'text-primary' },
      { variant: 'text', color: ['neutral', 'textSecondary'], class: 'text-foreground-muted' },
      { variant: 'text', color: 'error', class: 'text-danger' },
      { variant: 'text', color: 'success', class: 'text-success' },
      { variant: 'text', color: 'warning', class: 'text-warning-strong' },
      { variant: 'text', color: 'info', class: 'text-info' },
      { variant: 'text', color: 'textPrimary', class: 'text-foreground' },
    ],

    defaultVariants: {
      variant: 'filled',
      color: 'primary',
      size: 'default',
    },
  }
);
