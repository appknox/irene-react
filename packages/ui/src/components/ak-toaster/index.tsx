import { Toaster as Sonner, type ToasterProps } from 'sonner';

/** How long a toast stays on screen. Pass `duration: Infinity` for one that must be dismissed. */
export const AK_TOAST_DURATION = 7000;

/**
 * Renders the toast queue. Mount once, near the app root; toasts are raised with `akNotify`.
 *
 * A toast raised while a drawer or a modal is open stays usable: those take
 * the page by turning pointer events off on everything outside them, and the
 * toast is outside them, so it turns them back on for itself. Without that, a
 * toast with something to dismiss or undo can be read and not acted on.
 *
 * @param props - Anything sonner's Toaster takes, overriding the defaults here.
 * @returns The rendered toaster.
 */
function AkToaster(props: Readonly<ToasterProps>) {
  return (
    <Sonner
      position="bottom-right"
      duration={AK_TOAST_DURATION}
      visibleToasts={3}
      // Sonner hardcodes a system font stack on its container. An inline style
      // is what beats that stylesheet; toasts inherit from here.
      style={{ fontFamily: 'var(--font-sans)' }}
      className="pointer-events-auto"
      // Each toast renders an AkAlert, so sonner's own surface is turned off.
      toastOptions={{ unstyled: true, classNames: { toast: 'pointer-events-auto w-full' } }}
      {...props}
    />
  );
}

export { AkToaster };
