import { DropdownMenu as MenuPrimitive } from 'radix-ui';
import { type ComponentProps } from 'react';

import { cn } from '@irene/ui/cn';

/**
 * A list of actions opened from a control, such as the account menu.
 *
 * Built on Radix's dropdown, so it reads as a menu to assistive technology and
 * takes the arrow keys, Home, End and typeahead. A panel that holds anything
 * other than actions is an `AkPopover`, which takes focus without claiming to
 * be a menu.
 *
 * @param props.modal - Holds focus within the menu and covers the page behind it.
 */
function AkMenu({ modal = false, ...props }: ComponentProps<typeof MenuPrimitive.Root>) {
  return <MenuPrimitive.Root data-slot="menu" modal={modal} {...props} />;
}

/**
 * The control that opens the menu.
 *
 * @param props.asChild - Makes the child the trigger, rather than wrapping it in a button.
 */
function AkMenuTrigger({ ...props }: ComponentProps<typeof MenuPrimitive.Trigger>) {
  return <MenuPrimitive.Trigger data-slot="menu-trigger" {...props} />;
}

type AkMenuContentProps = ComponentProps<typeof MenuPrimitive.Content> & {
  arrow?: boolean;
  arrowClassName?: string;
};

/**
 * The menu itself, drawn in a portal so nothing on the page clips it.
 *
 * @param props.arrow - Draws a pointer at the trigger.
 * @param props.arrowClassName - Fills the pointer, for a menu whose edge is not the border.
 */
function AkMenuContent({
  arrow = false,
  arrowClassName,
  children,
  className,
  align = 'end',
  sideOffset = 6,
  ...props
}: AkMenuContentProps) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        data-slot="menu-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-52 origin-(--radix-dropdown-menu-content-transform-origin)',
          'overflow-hidden rounded-sm border border-border bg-popover py-1',
          'text-popover-foreground shadow-2 outline-hidden',
          `
            data-[state=closed]:animate-out data-[state=closed]:fade-out-0
            data-[state=closed]:zoom-out-95
          `,
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1',
          className
        )}
        {...props}
      >
        {children}

        {/* Filled with the menu's edge colour, so it reads as the border continuing to a point. */}
        {arrow && (
          <MenuPrimitive.Arrow
            data-slot="menu-arrow"
            width={14}
            height={8}
            className={cn('fill-border', arrowClassName)}
          />
        )}
      </MenuPrimitive.Content>
    </MenuPrimitive.Portal>
  );
}

type AkMenuItemProps = ComponentProps<typeof MenuPrimitive.Item> & {
  color?: 'default' | 'primary';
};

/**
 * One action in the menu.
 *
 * An item with no `onSelect` states something rather than doing it — the
 * account's name and address are in the menu that way — so it takes no pointer
 * and does not close the menu.
 *
 * @param props.color - primary for the one action that stands apart, such as signing out.
 * @param props.disabled - Reads as unavailable and takes no selection.
 */
function AkMenuItem({ color = 'default', className, onSelect, ...props }: AkMenuItemProps) {
  return (
    <MenuPrimitive.Item
      data-slot="menu-item"
      onSelect={onSelect}
      className={cn(
        'flex w-full items-center gap-2 px-3.5 py-1.75 text-base outline-hidden select-none',
        'data-disabled:pointer-events-none data-disabled:opacity-50',
        onSelect ? 'cursor-pointer focus:bg-hover-light' : 'cursor-default',
        color === 'primary' ? 'text-primary' : 'text-foreground',
        className
      )}
      {...props}
    />
  );
}

/** A rule between groups of actions. */
function AkMenuSeparator({ className, ...props }: ComponentProps<typeof MenuPrimitive.Separator>) {
  return (
    <MenuPrimitive.Separator
      data-slot="menu-separator"
      className={cn('my-1 h-px bg-divider', className)}
      {...props}
    />
  );
}

export { AkMenu, AkMenuContent, AkMenuItem, AkMenuSeparator, AkMenuTrigger };
