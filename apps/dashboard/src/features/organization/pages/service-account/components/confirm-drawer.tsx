import type { ReactNode } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkDrawer, AkDrawerBody, AkDrawerContent, AkDrawerHeader } from '@irene/ui/ak-drawer';

interface ConfirmDrawerProps {
  isOpen: boolean;

  /** What is being confirmed, which the caller words. */
  children: ReactNode;

  /** Replaces "Ok" on the control that goes ahead. */
  confirmText?: string;

  /** Holds both controls while the action is in flight. */
  isWorking?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * The question asked before a service account is changed for good.
 *
 * It is a panel down the side of the page rather than a box over it, which is
 * where this module asks: a 640px card inside the panel, the question above the
 * rule and the two controls below it.
 *
 * @param props.isOpen - Whether the question is being asked.
 * @param props.children - What is being confirmed.
 * @param props.confirmText - Replaces "Ok" on the control that goes ahead.
 * @param props.isWorking - Holds both controls while the action is in flight.
 * @param props.onConfirm - Called to go ahead.
 * @param props.onCancel - Called to leave things as they are.
 */
export function ConfirmDrawer({
  isOpen,
  children,
  confirmText,
  isWorking = false,
  onConfirm,
  onCancel,
}: Readonly<ConfirmDrawerProps>) {
  return (
    <AkDrawer open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AkDrawerContent aria-describedby={undefined} data-test-service-account-confirm-drawer>
        <AkDrawerHeader title={akMT('confirmation')} closeLabel={akMT('close')} />

        <AkDrawerBody noGutter>
          <div className="m-5.25 w-160 max-w-full rounded-xs border border-border">
            <div className="p-3.5" data-test-service-account-confirm-drawer-question>
              {children}
            </div>

            <AkDivider color="dark" />

            <div className="flex items-center gap-2.75 bg-background p-3.5 shadow-4">
              <AkButton
                type="button"
                loading={isWorking}
                onClick={onConfirm}
                data-test-service-account-confirm-drawer-confirm
              >
                {confirmText ?? akMT('ok')}
              </AkButton>

              <AkButton
                type="button"
                variant="outlined"
                color="neutral"
                disabled={isWorking}
                onClick={onCancel}
                data-test-service-account-confirm-drawer-cancel
              >
                {akMT('cancel')}
              </AkButton>
            </div>
          </div>
        </AkDrawerBody>
      </AkDrawerContent>
    </AkDrawer>
  );
}
