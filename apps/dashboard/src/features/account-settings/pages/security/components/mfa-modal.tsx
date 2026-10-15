import { type ReactNode } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkModal, AkModalContent, AkModalFooter, AkModalHeader } from '@irene/ui/ak-modal';

interface MfaModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * The modal every MFA step runs in.
 *
 * It is open for as long as it is rendered: the caller mounts it to open it
 * and unmounts it to close it, so each opening starts from its first step, as
 * irene's `{{#if}}` around each modal does.
 *
 * @param props.title - What the steps are for.
 * @param props.onClose - Called when the close control, Escape or the backdrop closes it.
 * @param props.children - The current step: its body, and its footer when it has one.
 */
export function MfaModal({ title, onClose, children }: Readonly<MfaModalProps>) {
  return (
    <AkModal open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AkModalContent aria-describedby={undefined}>
        <AkModalHeader title={title} closeLabel={akMT('close')} />

        {children}
      </AkModalContent>
    </AkModal>
  );
}

/**
 * The row of controls under a step, aligned to the right as irene's are.
 *
 * @param props.children - The step's buttons, the one that moves on first.
 */
export function MfaModalFooter({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <AkModalFooter className="flex-row items-center justify-end gap-2.5 px-5.25 py-3.5">
      {children}
    </AkModalFooter>
  );
}
