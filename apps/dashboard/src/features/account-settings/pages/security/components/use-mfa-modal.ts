import { useCallback, useState } from 'react';

/**
 * Holds the modal open until a step asks it to close.
 *
 * `closeModal` starts the closing animation, and the caller's `onClose` runs
 * once the panel has left the DOM, so the step is unmounted after the
 * animation rather than during it.
 *
 * @param onClose - Called once the panel is gone, to unmount the step.
 */
export function useMfaModal(onClose: () => void) {
  const [isOpen, setIsOpen] = useState(true);

  const closeModal = useCallback(() => setIsOpen(false), []);

  return { closeModal, modalProps: { isOpen, onClose, onOpenChange: setIsOpen } };
}
