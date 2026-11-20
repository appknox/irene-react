import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkTypography } from '@irene/ui/ak-typography';
import FakeAppInProgress from '@irene/ui/svgs/fake-app-in-progress.svg?react';
import FakeAppsSuccessState from '@irene/ui/svgs/fake-apps-success-state.svg?react';
import type { ApiSkApp } from '@irene/api/services/storeknox';

import {
  fakeAppDetectionIsInitializing,
  isDecommissioned,
} from '@/features/storeknox/utils/sk-app';

/**
 * What an app's fake-app list says in place of its tabs: detection still gathering its first
 * results, or having found nothing. Initializing wins, as in irene, so a deep link to a tab
 * of an initializing app shows this and requests no list.
 *
 * @param props.app - The inventory app the list is about.
 */
export function FakeAppListState({ app }: Readonly<{ app: ApiSkApp }>) {
  if (fakeAppDetectionIsInitializing(app)) {
    return (
      <div
        className="
          flex flex-col items-center justify-center gap-1 border border-border bg-background px-4
          py-7
        "
        data-test-sk-fake-app-list-initializing
      >
        <FakeAppInProgress aria-hidden="true" />

        <AkTypography variant="h5" className="mt-4">
          <AkMessageTranslate id="storeknox.fakeApps.detectionInProgress" />
        </AkTypography>

        <AkTypography align="center">
          <AkMessageTranslate id="storeknox.fakeApps.detectionInProgressDescription" />
        </AkTypography>
      </div>
    );
  }

  return (
    <div
      className="
        flex flex-col items-center justify-center gap-1 border border-border bg-background px-4 py-7
      "
      data-test-sk-fake-app-list-no-results
    >
      <FakeAppsSuccessState aria-hidden="true" />

      <AkTypography variant="h5" className="mt-4">
        <AkMessageTranslate id="storeknox.fakeApps.noSuspectedApps" />
      </AkTypography>

      <AkTypography align="center" className="max-w-137.5">
        {isDecommissioned(app) ? (
          <AkMessageTranslate id="storeknox.fakeApps.noSuspectedAppsDecommissionedDescription" />
        ) : (
          <AkMessageTranslate id="storeknox.fakeApps.noSuspectedAppsDescription" />
        )}
      </AkTypography>
    </div>
  );
}
