import { Dialog as DialogPrimitive } from 'radix-ui';
import { type ComponentProps } from 'react';

import { AkAppbar } from '@irene/ui/ak-appbar';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';

/**
 * A panel the page waits on, drawn over everything else.
 *
 * It takes focus and keeps it until it closes, so whatever is behind cannot be
 * reached while it is open. It is composed rather than configured: the header,
 * the body and the footer are written where they belong.
 */
function AkModal({ ...props }: ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="modal" {...props} />;
}

/**
 * The control that opens the panel.
 *
 * @param props.asChild - Makes the child the trigger, rather than wrapping it in a button.
 */
function AkModalTrigger({ ...props }: ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="modal-trigger" {...props} />;
}

/**
 * Closes the panel from within it.
 *
 * @param props.asChild - Makes the child the control, rather than wrapping it in a button.
 */
function AkModalClose({ ...props }: ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="modal-close" {...props} />;
}

/** The panel itself, over a backdrop that dims the page behind it. */
function AkModalContent({
  className,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        data-slot="modal-overlay"
        className={`
          fixed inset-0 z-50 bg-black/50
          data-[state=closed]:animate-out data-[state=closed]:fade-out-0
          data-[state=open]:animate-in data-[state=open]:fade-in-0
        `}
      />

      <DialogPrimitive.Content
        data-slot="modal-content"
        className={cn(
          `
            fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-64px)] -translate-x-1/2
            -translate-y-1/2 flex-col overflow-y-auto rounded-xs bg-background
            data-[state=closed]:animate-out data-[state=closed]:fade-out-0
            data-[state=closed]:zoom-out-95
            data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
          `,
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

type AkModalHeaderProps = Omit<ComponentProps<'header'>, 'color'> & {
  title: string;
  closeLabel: string;
};

/**
 * The bar across the top of the panel: what it is, and the way out of it.
 *
 * Drawn on the light surface, so it reads as a bar rather than as the first
 * line of the body beneath it.
 *
 * @param props.title - What the panel is for, read first by a screen reader.
 * @param props.closeLabel - Names the close control, which has no text of its own.
 */
function AkModalHeader({ title, closeLabel, children, ...props }: AkModalHeaderProps) {
  return (
    <AkAppbar color="light" data-slot="modal-header" className="justify-between" {...props}>
      <div className="flex items-center gap-2.5">
        <DialogPrimitive.Title asChild>
          <AkTypography variant="h5" fontWeight="medium" color="inherit">
            {title}
          </AkTypography>
        </DialogPrimitive.Title>

        {children}
      </div>

      <AkModalClose asChild>
        <AkIconButton size="small" aria-label={closeLabel} className="text-inherit">
          <AkIcon name="material-symbols:close" />
        </AkIconButton>
      </AkModalClose>
    </AkAppbar>
  );
}

type AkModalBodyProps = ComponentProps<'div'> & {
  noGutter?: boolean;
};

/**
 * What the panel is about, scrolled on its own when it outgrows the page.
 *
 * @param props.noGutter - Drops the padding, for a body that lays its own out.
 */
function AkModalBody({ noGutter = false, className, ...props }: AkModalBodyProps) {
  return (
    <div
      data-slot="modal-body"
      className={cn(
        'min-h-0 min-w-100 flex-auto overflow-y-auto',
        !noGutter && 'p-4.25',
        className
      )}
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
function AkModalFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div data-slot="modal-footer" className={cn('flex flex-col shadow-4', className)} {...props} />
  );
}

export {
  AkModal,
  AkModalBody,
  AkModalClose,
  AkModalContent,
  AkModalFooter,
  AkModalHeader,
  AkModalTrigger,
};
