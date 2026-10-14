import { cva } from 'class-variance-authority';

/** A label that appears beside whatever it describes, on hover or focus. */
export const akTooltipVariants = cva(
  [
    'z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-sm px-2.25 py-1.25',
    'text-sm text-balance',
    'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
    'data-[state=closed]:duration-100 data-[state=closed]:ease-in',
    'data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0',
    'data-[state=delayed-open]:zoom-in-95',
    'data-[state=delayed-open]:duration-150 data-[state=delayed-open]:ease-out',
    'data-[state=instant-open]:animate-in data-[state=instant-open]:fade-in-0',
    'data-[state=instant-open]:zoom-in-95',
    'data-[state=instant-open]:duration-150 data-[state=instant-open]:ease-out',
    'data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1',
    'data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1',
  ],
  {
    variants: {
      color: {
        light: 'bg-background text-foreground shadow-3',
        dark: 'bg-background-inverse text-white',
      },
    },

    defaultVariants: { color: 'dark' },
  }
);
