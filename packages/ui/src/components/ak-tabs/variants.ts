import { cva } from 'class-variance-authority';

/*
  The row of tabs. `line` and `shadow` are irene's two indicators and run the
  width of their container over a rule; `segmented` is a pill-shaped switch for
  a choice between a few views, sized to its tabs.
*/
export const akTabsListVariants = cva(
  `
    inline-flex items-center
    data-[orientation=vertical]:h-fit data-[orientation=vertical]:w-fit
    data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch
  `,
  {
    variants: {
      variant: {
        /* The rule runs under a row, and down the side of a column. */
        line: `
          w-full border-border
          data-[orientation=horizontal]:border-b
          data-[orientation=vertical]:border-r
        `,
        shadow: `
          w-full border-border
          data-[orientation=horizontal]:border-b
          data-[orientation=vertical]:border-r
        `,
        segmented: `
          w-fit gap-0.5 rounded-md bg-divider-strong p-0.75
          data-[orientation=horizontal]:h-9
        `,
      },
    },

    defaultVariants: { variant: 'line' },
  }
);

/*
  One tab. Every variant marks the active tab by `data-state=active`, which
  Radix sets on a button and on a link passed through `asChild` alike.
*/
export const akTabsTriggerVariants = cva(
  `
    group/tabs-trigger relative inline-flex shrink-0 cursor-pointer items-center justify-center
    gap-2 text-base whitespace-nowrap text-foreground-muted transition-colors outline-none
    focus-visible:ring-3 focus-visible:ring-ring/50
    data-disabled:pointer-events-none data-disabled:text-foreground-disabled
    [&_svg]:pointer-events-none [&_svg]:shrink-0
    [&_svg:not([class*='size-'])]:size-4.5
    data-[orientation=vertical]:justify-start
  `,
  {
    variants: {
      variant: {
        /* A 3px bar under the active tab, in the primary colour. */
        line: `
          h-10 px-4
          hover:bg-hover-light
          data-[state=active]:font-bold data-[state=active]:text-foreground
          data-[state=active]:hover:bg-transparent
          after:absolute after:bg-primary after:opacity-0 after:transition-opacity
          data-[state=active]:after:opacity-100
          data-[orientation=horizontal]:after:inset-x-0 data-[orientation=horizontal]:after:bottom-0
          data-[orientation=horizontal]:after:h-0.75
          data-[orientation=horizontal]:after:rounded-t-xs
          data-[orientation=vertical]:after:inset-y-0 data-[orientation=vertical]:after:right-0
          data-[orientation=vertical]:after:w-0.75 data-[orientation=vertical]:after:rounded-l-xs
        `,

        /* The active tab is lifted out of the row as a card, open on the side facing its view. */
        shadow: `
          h-10 border border-transparent px-4
          data-[orientation=horizontal]:rounded-t-md data-[orientation=horizontal]:border-b-0
          data-[orientation=vertical]:rounded-l-md data-[orientation=vertical]:border-r-0
          hover:bg-hover-light
          data-[state=active]:border-border data-[state=active]:bg-background
          data-[state=active]:font-bold data-[state=active]:text-primary
          data-[state=active]:shadow-4
          data-[state=active]:hover:bg-background
          data-[state=active]:[&_svg]:text-foreground
        `,

        /* The active tab is a raised surface on the tinted track. */
        segmented: `
          rounded-sm px-3 font-medium
          data-[orientation=horizontal]:h-full data-[orientation=horizontal]:flex-1
          data-[orientation=vertical]:h-8
          hover:text-foreground
          data-[state=active]:bg-background data-[state=active]:text-foreground
          data-[state=active]:shadow-15
        `,
      },
    },

    defaultVariants: { variant: 'line' },
  }
);

/*
  The count beside a tab's label. It tints with the tab it sits in, so the
  active tab's count reads as part of the selection.
*/
export const akTabsBadgeVariants = cva(
  'inline-flex h-5 min-w-6 items-center justify-center rounded-xs px-1 text-sm font-normal',
  {
    variants: {
      background: {
        true: `
          bg-divider-strong text-foreground-muted
          group-data-[state=active]/tabs-trigger:bg-primary/20
          group-data-[state=active]/tabs-trigger:text-foreground
        `,
        false: 'bg-transparent',
      },
    },

    defaultVariants: { background: true },
  }
);
