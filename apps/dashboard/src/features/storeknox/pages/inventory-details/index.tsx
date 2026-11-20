import { Outlet } from '@tanstack/react-router';
import { useLayoutEffect, useRef } from 'react';

import {
  InventoryAppContext,
  useInventoryAppQuery,
} from '@/features/storeknox/hooks/use-inventory-app';

import { PageWrapper } from '@/components/page-wrapper';

import { DetailsBanner } from './components/details-banner';
import { DetailsHeader } from './components/details-header';

/** The layout around every page about one app: the warning banner, the header and the page beneath. */
export function InventoryDetailsLayout() {
  const app = useInventoryAppQuery();
  const rootRef = useRef<HTMLDivElement>(null);
  const appId = app?.id;

  /* The router's scroll restoration does not reach the layout's own main element, so reset it per app. */
  useLayoutEffect(() => {
    const main = rootRef.current?.closest('main');

    if (main) {
      main.scrollTop = 0;
    }
  }, [appId]);

  if (!app) {
    return null;
  }

  return (
    <InventoryAppContext value={app}>
      <div ref={rootRef} className="flex w-full flex-col" data-test-sk-inventory-details>
        {/* Banner and header stick as one block so the header always sits under the banner. */}
        <div
          className="sticky top-0 z-10 flex flex-col bg-background-subtle"
          data-test-sk-details-sticky
        >
          <DetailsBanner app={app} />

          <PageWrapper contentWidth="standard" className="pb-0">
            {/* Keyed on the app, so the monitoring switch starts from each app's own state. */}
            <DetailsHeader key={app.id} app={app} />
          </PageWrapper>
        </div>

        <PageWrapper contentWidth="standard" className="flex flex-col pt-0">
          <Outlet />
        </PageWrapper>
      </div>
    </InventoryAppContext>
  );
}
