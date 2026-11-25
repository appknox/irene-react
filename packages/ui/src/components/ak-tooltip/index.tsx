import { Tooltip as TooltipPrimitive } from 'radix-ui';
import { Fragment, type ComponentProps, type ReactNode } from 'react';
import { type VariantProps } from 'class-variance-authority';

import { cn } from '@irene/ui/cn';

import { akTooltipVariants } from './variants';

/* The content's own `title` attribute is dropped: this one is what it holds, markup and all. */
type AkTooltipProps = Omit<ComponentProps<typeof TooltipPrimitive.Content>, 'title'> &
  VariantProps<typeof akTooltipVariants> & {
    title: ReactNode;
    children: ReactNode;
    disabled?: boolean;
    arrow?: boolean;
    delayDuration?: number;
  };

/**
 * Names the element it wraps, for a control that shows no label of its own.
 *
 * The child is the trigger, so the tooltip wraps rather than takes a ref. A
 * disabled tooltip renders the child alone: a collapsed navigation needs the
 * label, an expanded one already shows it, and the same markup serves both.
 *
 * @param props.title - What the trigger is.
 * @param props.children - The trigger. One element, which receives the handlers.
 * @param props.disabled - Renders the child without a tooltip.
 * @param props.color - Which surface it is drawn on.
 * @param props.arrow - Draws a pointer at the trigger.
 * @param props.arrowPadding - How close to a corner that pointer may be drawn.
 * @param props.delayDuration - How long the pointer rests before it opens.
 */
function AkTooltip({
  title,
  children,
  disabled = false,
  color,
  arrow = false,
  delayDuration = 0,
  className,
  sideOffset = 6,
  arrowPadding = 8,
  ...props
}: AkTooltipProps) {
  if (disabled) {
    return <Fragment>{children}</Fragment>;
  }

  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild data-slot="tooltip-trigger">
          {children}
        </TooltipPrimitive.Trigger>

        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            data-slot="tooltip"
            sideOffset={sideOffset}
            arrowPadding={arrowPadding}
            className={cn(akTooltipVariants({ color }), className)}
            {...props}
          >
            {title}

            {/*
              A window on a square turned on its corner, which is how irene draws it: the window
              is as wide and as deep as the pointer and hides what overflows, so only the half of
              the square outside the panel is seen, bordered on the two edges that meet at its
              point. Radix turns the window per side, and the square is centred on the window's
              inner edge, so it points at the trigger wherever the panel lands. The window is
              lifted 1px onto the panel, so its fill covers the panel's own edge there and the
              two read as one line.
            */}
            {arrow && (
              <TooltipPrimitive.Arrow asChild width={14} height={7} data-slot="tooltip-arrow">
                <div className="relative -mt-px h-[7px] w-3.5 overflow-hidden">
                  <div
                    className={cn(
                      'absolute top-0 left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45',
                      color === 'light'
                        ? 'border border-border bg-background'
                        : 'bg-background-inverse'
                    )}
                  />
                </div>
              </TooltipPrimitive.Arrow>
            )}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

export { AkTooltip };
