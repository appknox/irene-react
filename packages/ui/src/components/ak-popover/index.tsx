import { Popover as PopoverPrimitive } from 'radix-ui';
import { type ComponentProps } from 'react';

import { cn } from '@irene/ui/cn';

/**
 * A panel anchored to the control that opens it.
 *
 * Unlike a tooltip it takes focus and holds controls of its own, so it closes
 * on Escape and on a click outside. `modal` traps focus within it and covers
 * the page behind, for a panel the user should finish with before going on.
 *
 * It is composed rather than configured: the trigger and the panel are written
 * where they belong, so the call reads as the markup it produces.
 *
 * @param props.modal - Traps focus and covers the page behind.
 */
function AkPopover({ modal = false, ...props }: ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" modal={modal} {...props} />;
}

/**
 * The control that opens the panel.
 *
 * @param props.asChild - Makes the child the trigger, rather than wrapping it in a button.
 */
function AkPopoverTrigger({ ...props }: ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

/** Anchors the panel to something other than the trigger. */
function AkPopoverAnchor({ ...props }: ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

/**
 * Closes the panel from within it.
 *
 * @param props.asChild - Makes the child the control, rather than wrapping it in a button.
 */
function AkPopoverClose({ ...props }: ComponentProps<typeof PopoverPrimitive.Close>) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />;
}

type AkPopoverContentProps = ComponentProps<typeof PopoverPrimitive.Content> & {
  arrow?: boolean;
  arrowClassName?: string;
};

/**
 * The panel itself, drawn in a portal so nothing on the page clips it.
 *
 * @param props.arrow - Draws a pointer at the trigger.
 * @param props.arrowClassName - Fills the pointer, for a panel whose edge is not the border.
 */
function AkPopoverContent({
  arrow = false,
  arrowClassName,
  children,
  className,
  align = 'start',
  sideOffset = 8,
  ...props
}: AkPopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 w-72 origin-(--radix-popover-content-transform-origin)',
          'rounded-sm border border-border bg-popover p-4 text-popover-foreground',
          'shadow-18 outline-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          'data-[state=closed]:zoom-out-95',
          'data-[state=closed]:duration-100 data-[state=closed]:ease-in',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0',
          'data-[state=open]:zoom-in-95 data-[state=open]:duration-150 data-[state=open]:ease-out',
          'data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1',
          'data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1',
          className
        )}
        {...props}
      >
        {children}

        {/* Filled with the panel's edge colour, so it reads as the border continuing to a point. */}
        {arrow && (
          <PopoverPrimitive.Arrow
            data-slot="popover-arrow"
            width={12}
            height={6}
            className={cn('fill-border', arrowClassName)}
          />
        )}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}

export { AkPopover, AkPopoverAnchor, AkPopoverClose, AkPopoverContent, AkPopoverTrigger };
