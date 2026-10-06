import { Dialog as DialogPrimitive } from 'radix-ui';
import { type VariantProps } from 'class-variance-authority';
import { type ComponentProps } from 'react';

import { AkAppbar } from '@irene/ui/ak-appbar';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';

import { akDrawerVariants } from './variants';

/**
 * A panel the page waits on, drawn down one edge of it.
 *
 * It is the modal for something read alongside the page rather than in place
 * of it — a definition, a filter, an explanation — so it keeps the full height
 * and is as wide as what it holds. Like the modal, it takes focus until it
 * closes, and is composed rather than configured.
 */
function AkDrawer({ ...props }: ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="drawer" {...props} />;
}

/**
 * The control that opens the panel.
 *
 * @param props.asChild - Makes the child the trigger, rather than wrapping it in a button.
 */
function AkDrawerTrigger({ ...props }: ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

/**
 * Closes the panel from within it.
 *
 * @param props.asChild - Makes the child the control, rather than wrapping it in a button.
 */
function AkDrawerClose({ ...props }: ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="drawer-close" {...props} />;
}

type AkDrawerContentProps = ComponentProps<typeof DialogPrimitive.Content> &
  VariantProps<typeof akDrawerVariants>;

/**
 * The panel itself, over a backdrop that dims the page behind it.
 *
 * @param props.anchor - The edge it slides in from, the right by default.
 */
function AkDrawerContent({
  anchor = 'right',
  className,
  children,
  ...props
}: AkDrawerContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        data-slot="drawer-overlay"
        className={`
          fixed inset-0 z-50 bg-black/50
          data-[state=closed]:animate-out data-[state=closed]:fade-out-0
          data-[state=open]:animate-in data-[state=open]:fade-in-0
        `}
      />

      <DialogPrimitive.Content
        data-slot="drawer-content"
        data-anchor={anchor}
        className={cn(akDrawerVariants({ anchor }), className)}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

type AkDrawerHeaderProps = Omit<ComponentProps<'header'>, 'color'> & {
  title: string;
  closeLabel: string;
};

/**
 * The bar across the top of the panel: what it is, and the way out of it.
 *
 * It is 56px tall, the same as the bar across the top of a page, so a drawer
 * opening beside one lines up with it.
 *
 * @param props.title - What the panel is for, read first by a screen reader.
 * @param props.closeLabel - Names the close control, which has no text of its own.
 */
function AkDrawerHeader({ title, closeLabel, children, ...props }: AkDrawerHeaderProps) {
  return (
    <AkAppbar
      color="light"
      data-slot="drawer-header"
      className="h-14 shrink-0 justify-between px-5.25"
      {...props}
    >
      <div className="flex items-center gap-2.5">
        <DialogPrimitive.Title asChild>
          <AkTypography variant="h5" color="inherit">
            {title}
          </AkTypography>
        </DialogPrimitive.Title>

        {children}
      </div>

      <AkDrawerClose asChild>
        <AkIconButton size="small" aria-label={closeLabel} className="text-inherit">
          <AkIcon name="material-symbols:close" />
        </AkIconButton>
      </AkDrawerClose>
    </AkAppbar>
  );
}

type AkDrawerBodyProps = ComponentProps<'div'> & {
  noGutter?: boolean;
};

/**
 * What the panel is about, scrolled on its own when it outgrows the page.
 *
 * @param props.noGutter - Drops the padding, for a body that lays its own out.
 */
function AkDrawerBody({ noGutter = false, className, ...props }: AkDrawerBodyProps) {
  return (
    <div
      data-slot="drawer-body"
      className={cn('min-h-0 flex-auto overflow-y-auto', !noGutter && 'p-4.25', className)}
      {...props}
    />
  );
}

/**
 * The panel's controls, below what it is about.
 *
 * Shadowed upwards, so a body scrolled behind it reads as going under it
 * rather than stopping there.
 */
function AkDrawerFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn('flex shrink-0 gap-2 px-5 py-2 shadow-4', className)}
      {...props}
    />
  );
}

export {
  AkDrawer,
  AkDrawerBody,
  AkDrawerClose,
  AkDrawerContent,
  AkDrawerFooter,
  AkDrawerHeader,
  AkDrawerTrigger,
};
