import { cva } from 'class-variance-authority';

export const akAccordionTriggerVariants = cva(
  `
    group/accordion flex w-full cursor-pointer items-center justify-between gap-3 rounded-sm px-4
    py-3 text-left outline-none
    focus-visible:ring-3 focus-visible:ring-ring/50
    disabled:cursor-not-allowed disabled:opacity-50
  `,
  {
    variants: {
      variant: {
        primary: 'border border-primary/10 bg-primary/10',
        secondary: 'border border-border bg-background-subtle',
        light: 'bg-background shadow-12',
      },
    },

    defaultVariants: { variant: 'primary' },
  }
);
