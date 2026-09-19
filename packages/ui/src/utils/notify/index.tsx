import { toast, type ExternalToast } from 'sonner';
import type { ReactNode } from 'react';

import { AkAlert, AkAlertDescription, AkAlertTitle } from '@irene/ui/ak-alert';
import { AkIcon } from '@irene/ui/ak-icon';
import type { IconName } from '@irene/ui/icons/sets';

type NotifyKind = 'success' | 'info' | 'warning' | 'error';
type NotifyOptions = Omit<ExternalToast, 'description'> & { description?: ReactNode };

const ICONS: Record<NotifyKind, IconName> = {
  success: 'lucide:circle-check',
  info: 'lucide:info',
  warning: 'lucide:triangle-alert',
  error: 'lucide:octagon-x',
};

/**
 * Raises a toast rendered as an `AkAlert`, so a message reads the same whether it sits on the page or floats above it.
 *
 * @param kind - Which alert to render.
 * @param message - The message.
 * @param options - Sonner options, plus a description rendered under the message. Pass `duration: Infinity` to keep it until dismissed.
 * @returns The toast id, for `akNotify.dismiss`.
 */
function _notify(kind: NotifyKind, message: ReactNode, options: NotifyOptions = {}) {
  const { description, ...rest } = options;

  return toast.custom(
    (id) => (
      <AkAlert variant={kind} className="shadow-lg" onDismiss={() => toast.dismiss(id)}>
        <AkIcon name={ICONS[kind]} />

        <AkAlertTitle>{message}</AkAlertTitle>

        {description && <AkAlertDescription>{description}</AkAlertDescription>}
      </AkAlert>
    ),
    rest
  );
}

/** Raises a toast from anywhere, including outside React. `<AkToaster />` renders them. */
export const akNotify = {
  success: (message: ReactNode, options?: NotifyOptions) => _notify('success', message, options),
  info: (message: ReactNode, options?: NotifyOptions) => _notify('info', message, options),
  warning: (message: ReactNode, options?: NotifyOptions) => _notify('warning', message, options),
  error: (message: ReactNode, options?: NotifyOptions) => _notify('error', message, options),
  dismiss: (id?: string | number) => toast.dismiss(id),
};
