import { useQuery } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { useState } from 'react';

import { cn } from '@irene/ui/cn';

import { PageWrapper } from '@/components/page-wrapper';
import { skFakeAppOptions } from '@/features/storeknox/queries/fake-apps';
import { skInventoryAppOptions } from '@/features/storeknox/queries/inventory';
import { isFakeAppIgnored } from '@/features/storeknox/utils/fake-app';
import { buildSignalGroups, type Signal } from '@/features/storeknox/utils/fake-app-signals';

import { DetailsHeader } from './components/details-header';
import { FindingsCard } from './components/findings-card';
import { IgnoredBanner } from './components/ignored-banner';
import { OriginalAppInfo } from './components/original-app-info';
import { SignalDrawer } from './components/signal-drawer';
import { SignalGroup } from './components/signal-group';

const routeApi = getRouteApi(
  '/_authenticated/dashboard_/storeknox/fake-apps/$skApp_/details/$appId'
);

/**
 * A suspected copy's details: the ignored note, the header with the ignore actions, the AI's
 * findings (greyed once ignored) beside the original app's panel, and a drawer for each signal's
 * reasoning. The route loads both records, so neither is missing when this renders.
 */
export function FakeAppDetailsPage() {
  const { skApp, appId } = routeApi.useParams();
  const { data: skInventoryApp } = useQuery(skInventoryAppOptions(skApp));
  const { data: fakeApp } = useQuery(skFakeAppOptions(skApp, appId));
  const [selected, setSelected] = useState<{ signal: Signal; groupTitle: string } | null>(null);

  if (!skInventoryApp || !fakeApp) {
    return null;
  }

  const ignored = isFakeAppIgnored(fakeApp);

  return (
    <div className="flex w-full flex-col gap-2" data-test-sk-fake-app-details>
      <IgnoredBanner fakeApp={fakeApp} />

      <PageWrapper contentWidth="standard">
        <DetailsHeader fakeApp={fakeApp} skInventoryApp={skInventoryApp} />

        <div className="flex w-full items-stretch gap-4">
          <div
            className={cn('flex w-[70%] flex-col gap-4', ignored && 'opacity-60')}
            data-test-sk-fake-app-findings
          >
            <FindingsCard fakeApp={fakeApp} isIgnored={ignored} />

            {buildSignalGroups(fakeApp).map((group) => (
              <SignalGroup
                key={group.id}
                group={group}
                onSignalClick={(signal, groupTitle) => setSelected({ signal, groupTitle })}
              />
            ))}
          </div>

          <OriginalAppInfo app={skInventoryApp} isIgnored={ignored} />
        </div>

        <SignalDrawer
          signal={selected?.signal ?? null}
          groupTitle={selected?.groupTitle ?? ''}
          onClose={() => setSelected(null)}
        />
      </PageWrapper>
    </div>
  );
}
