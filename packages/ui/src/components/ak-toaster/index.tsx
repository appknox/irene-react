import { Toaster as Sonner, type ToasterProps } from 'sonner';

/** How long a toast stays on screen. Pass `duration: Infinity` for one that must be dismissed. */
export const AK_TOAST_DURATION = 7000;

/**
 * Renders the toast queue. Mount once, near the app root; toasts are raised with `akNotify`.
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
      // Each toast renders an AkAlert, so sonner's own surface is turned off.
      toastOptions={{ unstyled: true, classNames: { toast: 'w-full' } }}
      {...props}
    />
  );
}

export { AkToaster };
