import { useBlocker } from '@tanstack/react-router';

import {
  AkModal,
  AkModalBody,
  AkModalContent,
  AkModalFooter,
  AkModalHeader,
} from '@irene/ui/ak-modal';

import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkTypography } from '@irene/ui/ak-typography';

interface UnsavedChangesGuardProps {
  shouldBlock: () => boolean;
  reportName: string;
  onSaveAndLeave: () => void;
}

/**
 * Asks before leaving a saved report with unsaved changes: stay, leave without
 * them, or save and then leave. Closing the tab gets the browser's own prompt.
 *
 * @param props.shouldBlock - Whether leaving now would lose unsaved changes; read at the moment of leaving.
 * @param props.reportName - The report's name.
 * @param props.onSaveAndLeave - Opens the save drawer; leaving waits for the save.
 */
export function UnsavedChangesGuard({ shouldBlock, reportName, onSaveAndLeave }: Readonly<UnsavedChangesGuardProps>) {
  const blocker = useBlocker({
    shouldBlockFn: shouldBlock,
    enableBeforeUnload: shouldBlock,
    withResolver: true,
  });

  if (blocker.status !== 'blocked') {
    return null;
  }

  return (
    <AkModal open onOpenChange={(open) => !open && blocker.reset()}>
      <AkModalContent aria-describedby={undefined} data-test-unsaved-changes>
        <AkModalHeader title={akMT('reportModule.view.unsavedTitle')} closeLabel={akMT('close')} />

        <AkModalBody>
          <AkTypography>{akMT('reportModule.view.unsavedBody', { name: reportName })}</AkTypography>
        </AkModalBody>

        <AkModalFooter className="flex-row items-center justify-end gap-2.5 px-5.25 py-3.5">
          <AkButton variant="outlined" color="neutral" onClick={blocker.reset}>
            {akMT('reportModule.view.keepEditing')}
          </AkButton>

          <AkButton variant="outlined" color="error" onClick={blocker.proceed}>
            {akMT('reportModule.view.leaveWithoutSaving')}
          </AkButton>

          <AkButton
            onClick={() => {
              blocker.reset();
              onSaveAndLeave();
            }}
          >
            {akMT('reportModule.view.saveChanges')}
          </AkButton>
        </AkModalFooter>
      </AkModalContent>
    </AkModal>
  );
}
