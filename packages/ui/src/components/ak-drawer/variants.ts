import { cva } from 'class-variance-authority';

/*
  A panel down one edge of the page, full height and as wide as what it holds.
  The edge decides where it sits and which way it slides in.
*/
export const akDrawerVariants = cva(
  `
    fixed inset-y-0 z-50 flex max-w-full flex-col bg-background shadow-9
    data-[state=closed]:animate-out
    data-[state=open]:animate-in
  `,
  {
    variants: {
      anchor: {
        left: `left-0 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left`,
        right: `
          right-0
          data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right
        `,
      },
    },

    defaultVariants: { anchor: 'right' },
  }
);
