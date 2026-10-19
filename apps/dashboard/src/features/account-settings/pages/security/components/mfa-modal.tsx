import { useEffect, useRef, type ReactNode } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkModal, AkModalContent, AkModalFooter, AkModalHeader } from '@irene/ui/ak-modal';

interface CloseOnUnmountProps {
  isOpen: boolean;
  onUnmount: () => void;
}

interface MfaModalProps {
  title: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onClose: () => void;
  children: ReactNode;
}

/**
 * The modal every MFA step runs in.
 *
 * The caller mounts it to open it, so each opening starts from its first step.
 * Its props come from `useMfaModal`, which is what the step closes it with.
 *
 * @param props.title - What the steps are for.
 * @param props.isOpen - Whether the panel is showing or closing.
 * @param props.onOpenChange - Called when the close control, Escape or the backdrop closes it.
 * @param props.onClose - Called once the panel has left the DOM.
 * @param props.children - The current step: its body, and its footer when it has one.
 */
export function MfaModal({
  title,
  isOpen,
  onOpenChange,
  onClose,
  children,
}: Readonly<MfaModalProps>) {
  return (
    <AkModal open={isOpen} onOpenChange={onOpenChange}>
      <AkModalContent aria-describedby={undefined}>
        <AkModalHeader title={title} closeLabel={akMT('close')} />

        {children}

        <CloseOnUnmount isOpen={isOpen} onUnmount={onClose} />
      </AkModalContent>
    </AkModal>
  );
}

/**
 * Reports the panel's removal from the DOM, which happens after its closing
 * animation has finished.
 *
 * @param props.isOpen - Whether the panel is still meant to be showing.
 * @param props.onUnmount - Called when the panel is removed after being closed.
 */
function CloseOnUnmount({ isOpen, onUnmount }: Readonly<CloseOnUnmountProps>) {
  const latestProps = useRef({ isOpen, onUnmount });

  useEffect(() => {
    latestProps.current = { isOpen, onUnmount };
  });

  useEffect(
    () => () => {
      // A panel still marked open is being torn down by something other than a
      // close, such as the page unmounting or a development remount.
      if (!latestProps.current.isOpen) {
        latestProps.current.onUnmount();
      }
    },
    []
  );

  return null;
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
