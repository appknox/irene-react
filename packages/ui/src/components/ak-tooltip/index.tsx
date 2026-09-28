import { Tooltip as TooltipPrimitive } from 'radix-ui';
import { Fragment, type ComponentProps, type ReactNode } from 'react';
import { type VariantProps } from 'class-variance-authority';

import { cn } from '@irene/ui/cn';

import { akTooltipVariants } from './variants';

type AkTooltipProps = ComponentProps<typeof TooltipPrimitive.Content> &
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
            className={cn(akTooltipVariants({ color }), className)}
            {...props}
          >
            {title}

            {/* Radix draws the triangle and places it per side, so it only takes a fill. */}
            {arrow && (
              <TooltipPrimitive.Arrow
                data-slot="tooltip-arrow"
                width={10}
                height={5}
                className={color === 'light' ? 'fill-background' : 'fill-background-inverse'}
              />
            )}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

export { AkTooltip };
