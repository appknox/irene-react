import type { ReactNode } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkModal, AkModalBody, AkModalContent, AkModalHeader } from '@irene/ui/ak-modal';
import { AkTypography } from '@irene/ui/ak-typography';

/** Props for the `AkConfirmBox` component. */
interface AkConfirmBoxProps {
  isOpen: boolean;
  description?: string;
  children?: ReactNode;
  title?: string;
  confirmText?: string;
  cancelText?: string;

  /** Holds the box open and the confirm control busy while the action runs. */
  isWorking?: boolean;

  /** Blurs the page behind the question as well as dimming it. */
  blurOverlay?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Asks before an action that cannot be taken back.
 *
 * Every question in the dashboard is asked through this, so they read and
 * behave alike: a titled bar, the question, then the way on and the way out.
 * The confirming control comes first and carries the action's own word, so the
 * question is answered rather than merely agreed with.
 *
 * @param props.isOpen - Whether the question is being asked.
 * @param props.description - The question itself.
 * @param props.children - Asked in place of a plain question, for one that needs more than a line.
 * @param props.title - The bar's title.
 * @param props.confirmText - The confirming control's word.
 * @param props.cancelText - The dismissing control's word.
 * @param props.isWorking - Whether the action is under way.
 * @param props.blurOverlay - Blurs what is behind the question, for one asked over a panel that
 * is itself over the page.
 * @param props.onConfirm - Called to go ahead.
 * @param props.onCancel - Called to leave things as they are.
 */
function AkConfirmBox({
  isOpen,
  description,
  children,
  title,
  confirmText,
  cancelText,
  isWorking = false,
  blurOverlay = false,
  onConfirm,
  onCancel,
}: Readonly<AkConfirmBoxProps>) {
  return (
    <AkModal open={isOpen} onOpenChange={(open) => !open && !isWorking && onCancel()}>
      <AkModalContent className="max-w-125" blurOverlay={blurOverlay} data-test-confirm-box>
        <AkModalHeader
          title={title ?? akMT('confirm')}
          closeLabel={akMT('close')}
          data-test-confirm-box-header
        />

        <AkModalBody className="flex flex-col items-center justify-center">
          {children ?? (
            <AkTypography align="center" data-test-confirm-box-description>
              {description}
            </AkTypography>
          )}

          <div className="mt-5.25 flex w-full items-center justify-center gap-3.5">
            <AkButton loading={isWorking} onClick={onConfirm} data-test-confirm-box-confirm>
              {confirmText ?? akMT('ok')}
            </AkButton>

            <AkButton
              variant="outlined"
              color="neutral"
              disabled={isWorking}
              onClick={onCancel}
              data-test-confirm-box-cancel
            >
              {cancelText ?? akMT('cancel')}
            </AkButton>
          </div>
        </AkModalBody>
      </AkModalContent>
    </AkModal>
  );
}

export { AkConfirmBox };
