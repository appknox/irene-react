import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkMenu, AkMenuContent, AkMenuItem, AkMenuTrigger } from '@irene/ui/ak-menu';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import type { ApiSkFakeApp } from '@irene/api/services/storeknox';

import { IgnoreDrawer } from '@/features/storeknox/components/ignore-drawer';
import { skInventoryAppOptions } from '@/features/storeknox/queries/inventory';
import { canAddFakeAppToInventory } from '@/features/storeknox/utils/fake-app';
import { isDecommissioned } from '@/features/storeknox/utils/sk-app';

interface FakeAppActionCellProps {
  skAppId: string;
  fakeApp: ApiSkFakeApp;
}

/**
 * A row's menu: Ignore, and Ignore & Add to Inventory unless the copy is from a store that
 * cannot be monitored. Both are off, with the reason on hover, once the inventory app is gone
 * from its store; irene's row menu forgets that check, which the details page makes.
 *
 * @param props.skAppId - The inventory app the copy belongs to.
 * @param props.fakeApp - The copy of the row.
 */
export function FakeAppActionCell({ skAppId, fakeApp }: Readonly<FakeAppActionCellProps>) {
  const { data: app } = useQuery(skInventoryAppOptions(skAppId));
  const [addToInventory, setAddToInventory] = useState<boolean | null>(null);

  const decommissioned = app ? isDecommissioned(app) : false;
  const canAdd = canAddFakeAppToInventory(fakeApp);

  return (
    /* The menu and drawer render in portals, whose clicks still bubble through React to the row. */
    <span className="inline-flex" onClick={(event) => event.stopPropagation()}>
      <AkMenu>
        <AkMenuTrigger asChild>
          <AkIconButton aria-label={akMT('actions')} data-test-sk-fake-app-action={fakeApp.id}>
            <AkIcon name="material-symbols:more-vert" />
          </AkIconButton>
        </AkMenuTrigger>

        <AkMenuContent arrow>
          <AkTooltip
            disabled={!decommissioned}
            arrow
            side="left"
            title={akMT('storeknox.decommissionedActionDisabled')}
          >
            <span className="block">
              <AkMenuItem disabled={decommissioned} onSelect={() => setAddToInventory(false)}>
                {akMT('storeknox.fakeApps.ignore')}
              </AkMenuItem>
            </span>
          </AkTooltip>

          {canAdd && (
            <AkTooltip
              disabled={!decommissioned}
              arrow
              side="left"
              title={akMT('storeknox.decommissionedActionDisabled')}
            >
              <span className="block">
                <AkMenuItem disabled={decommissioned} onSelect={() => setAddToInventory(true)}>
                  {akMT('storeknox.fakeApps.ignoreAndAddToInventory')}
                </AkMenuItem>
              </span>
            </AkTooltip>
          )}
        </AkMenuContent>
      </AkMenu>

      <IgnoreDrawer
        skAppId={skAppId}
        fakeApp={fakeApp}
        addToInventory={addToInventory === true}
        open={addToInventory !== null}
        onClose={() => setAddToInventory(null)}
      />
    </span>
  );
}
