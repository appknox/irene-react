import { Fragment, type ReactNode } from 'react';

import {
  AkDrawer,
  AkDrawerBody,
  AkDrawerContent,
  AkDrawerFooter,
  AkDrawerHeader,
} from '@irene/ui/ak-drawer';

import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';

interface IntegrationDrawerProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;

  /** Called by the integrate control, and by the disconnect control that replaces it. */
  onSave: () => void;
  onClose: () => void;
  isSaving?: boolean;

  /** Replaces integrate and cancel with the one way to disconnect a connected service. */
  showDisconnect?: boolean;

  /** Saves changes to a connection rather than making one, so the control reads "save". */
  isEditing?: boolean;
  onEdit?: () => void;

  /** Drops the controls, for a pane that carries its own. */
  noFooter?: boolean;
}

/**
 * The panel one service is connected and managed in.
 *
 * Which controls it carries follows the state of the connection: a service that
 * is not connected is integrated or cancelled, a connected one is disconnected,
 * and a connection being changed is saved.
 *
 * @param props.isOpen - Whether the panel is open.
 * @param props.title - What the panel is about.
 * @param props.children - The panel's contents.
 * @param props.onSave - Called by the integrate control, and by disconnect where it replaces it.
 * @param props.onClose - Called to close the panel, by its own control and by cancel.
 * @param props.isSaving - Marks the integrate or save control busy.
 * @param props.showDisconnect - Offers disconnect alone, for a connected service.
 * @param props.isEditing - Offers save rather than integrate.
 * @param props.onEdit - Called by the save control.
 * @param props.noFooter - Drops the controls, for contents that carry their own.
 */
export function IntegrationDrawer({
  isOpen,
  title,
  children,
  onSave,
  onClose,
  isSaving = false,
  showDisconnect = false,
  isEditing = false,
  onEdit,
  noFooter = false,
}: Readonly<IntegrationDrawerProps>) {
  return (
    <AkDrawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* No width of its own: irene's drawer is as wide as the pane inside it. */}
      <AkDrawerContent data-test-integration-drawer>
        <AkDrawerHeader title={title} closeLabel={akMT('close')} />

        <AkDrawerBody className="flex flex-col">{children}</AkDrawerBody>

        {!noFooter && (
          <AkDrawerFooter className="gap-2.75 px-5.25 py-3.5">
            {showDisconnect && (
              <AkButton variant="outlined" onClick={onSave} data-test-integration-disconnect>
                {akMT('disconnect')}
              </AkButton>
            )}

            {!showDisconnect && (
              <Fragment>
                {isEditing ? (
                  <AkButton loading={isSaving} onClick={onEdit} data-test-integration-save>
                    {akMT('save')}
                  </AkButton>
                ) : (
                  <AkButton loading={isSaving} onClick={onSave} data-test-integration-integrate>
                    {akMT('integrate')}
                  </AkButton>
                )}

                <AkButton
                  variant="outlined"
                  color="neutral"
                  onClick={onClose}
                  data-test-integration-cancel
                >
                  {akMT('cancel')}
                </AkButton>
              </Fragment>
            )}
          </AkDrawerFooter>
        )}
      </AkDrawerContent>
    </AkDrawer>
  );
}
