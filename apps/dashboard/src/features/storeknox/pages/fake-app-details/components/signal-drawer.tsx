import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkDrawer, AkDrawerContent, AkDrawerHeader } from '@irene/ui/ak-drawer';
import { AkTypography } from '@irene/ui/ak-typography';

import type { Signal } from '@/features/storeknox/utils/fake-app-signals';

import { SignalResult } from './signal-result';

interface SignalDrawerProps {
  /** The signal to explain; the drawer is closed while there is none. */
  signal: Signal | null;
  groupTitle: string;
  onClose: () => void;
}

/**
 * The drawer a signal row opens: the group it belongs to, the signal, its result and the AI's
 * reasoning for it.
 *
 * @param props.signal - The selected signal, or `null` when the drawer is closed.
 * @param props.groupTitle - The title of the group the signal sits in, shown as the drawer's title.
 * @param props.onClose - Called when the drawer is dismissed.
 */
export function SignalDrawer({ signal, groupTitle, onClose }: Readonly<SignalDrawerProps>) {
  return (
    <AkDrawer open={signal !== null} onOpenChange={(open) => !open && onClose()}>
      <AkDrawerContent
        aria-describedby={undefined}
        className="w-125 max-w-full"
        data-test-sk-signal-drawer
      >
        <AkDrawerHeader title={groupTitle} closeLabel={akMT('close')} />

        {signal && (
          <div className="flex flex-col gap-6 p-6">
            <div className="flex gap-12">
              <div className="flex flex-col gap-2">
                <AkTypography fontWeight="bold" color="textSecondary">
                  <AkMessageTranslate id="storeknox.fakeApps.signal" />
                </AkTypography>

                <AkTypography>{signal.title}</AkTypography>
              </div>

              <div className="flex flex-col gap-2">
                <AkTypography fontWeight="bold" color="textSecondary">
                  <AkMessageTranslate id="storeknox.fakeApps.result" />
                </AkTypography>

                <SignalResult signal={signal} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <AkTypography fontWeight="bold">
                <AkMessageTranslate id="storeknox.fakeApps.reasoning" />
              </AkTypography>

              <AkTypography>{signal.description}</AkTypography>
            </div>
          </div>
        )}
      </AkDrawerContent>
    </AkDrawer>
  );
}
