import { Link } from '@tanstack/react-router';
import { useState } from 'react';

import { ENUMS } from '@irene/enums';
import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkBreadcrumbs, AkBreadcrumbsItem } from '@irene/ui/ak-breadcrumbs';
import { AkButton } from '@irene/ui/ak-button';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';
import type { ApiSkFakeApp, ApiSkInventoryApp } from '@irene/api/services/storeknox';

import { FakeAppStoreIcon } from '@/features/storeknox/components/fake-app-store-icon';
import { IgnoreDrawer } from '@/features/storeknox/components/ignore-drawer';
import { SkPlatformLabel } from '@/features/storeknox/components/sk-platform-label';
import { SkRoundAppIcon } from '@/features/storeknox/components/sk-round-app-icon';
import { canAddFakeAppToInventory, isFakeAppIgnored } from '@/features/storeknox/utils/fake-app';
import { isDecommissioned } from '@/features/storeknox/utils/sk-app';

interface DetailsHeaderProps {
  fakeApp: ApiSkFakeApp;
  skInventoryApp: ApiSkInventoryApp;
}

/**
 * The header of a copy's details: breadcrumbs, identity, the ignore actions and chips for
 * classification, platform and store. The actions are View Details once the copy is ignored.
 * Only a decommissioned app locks the actions here; archived apps keep theirs, as in irene.
 *
 * @param props.fakeApp - The copy the page is about.
 * @param props.skInventoryApp - The inventory app it imitates; its status and package name are read.
 */
export function DetailsHeader({ fakeApp, skInventoryApp }: Readonly<DetailsHeaderProps>) {
  const [addToInventory, setAddToInventory] = useState<boolean | null>(null);

  const ignored = isFakeAppIgnored(fakeApp);
  const decommissioned = isDecommissioned(skInventoryApp);
  const addDisabled = decommissioned || !canAddFakeAppToInventory(fakeApp);
  const android = fakeApp.store.platform === ENUMS.PLATFORM.ANDROID;
  const brandAbuse = fakeApp.ai_classification_label === 'brand_abuse';

  return (
    <section
      className="w-full pb-6"
      aria-label={fakeApp.title}
      data-test-sk-fake-app-details-header
    >
      <AkBreadcrumbs aria-label={akMT('storeknox.fakeAppsTitle')} className="pb-6">
        <AkBreadcrumbsItem asChild>
          <Link to="/dashboard/storeknox/fake-apps">
            <AkMessageTranslate id="storeknox.fakeAppsTitle" />
          </Link>
        </AkBreadcrumbsItem>

        <AkBreadcrumbsItem asChild>
          <Link
            to="/dashboard/storeknox/fake-apps/$skApp"
            params={{ skApp: String(skInventoryApp.id) }}
          >
            {skInventoryApp.app_metadata.package_name}
          </Link>
        </AkBreadcrumbsItem>

        <AkBreadcrumbsItem current>
          <AkMessageTranslate id="details" />
        </AkBreadcrumbsItem>
      </AkBreadcrumbs>

      <div className="flex w-full justify-between gap-2 border border-border bg-background p-6">
        <div className="flex min-w-0 items-center gap-4">
          <SkRoundAppIcon
            src={fakeApp.fake_app_icon_url}
            alt={fakeApp.title}
            className="size-14.5"
          />

          <div className="flex min-w-0 flex-col items-start gap-1.5">
            <a
              href={fakeApp.app_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 max-w-112.5 underline"
            >
              <AkTypography variant="h5" fontWeight="bold" noWrap title={fakeApp.title}>
                {fakeApp.title}
              </AkTypography>
            </a>

            <div className="flex items-center gap-2">
              <AkTypography color="textPrimary" noWrap className="max-w-62.5">
                {fakeApp.package_name}
              </AkTypography>

              <AkTypography color="textSecondary" fontWeight="bold" aria-hidden="true">
                •
              </AkTypography>

              <AkTypography color="textSecondary">{fakeApp.dev_name}</AkTypography>
            </div>
          </div>
        </div>

        <div className="flex min-w-100 items-center justify-end gap-3 self-end">
          {ignored ? (
            <AkButton onClick={() => setAddToInventory(false)}>{akMT('viewDetails')}</AkButton>
          ) : (
            <>
              <AkTooltip
                arrow
                disabled={!decommissioned}
                title={akMT('storeknox.decommissionedActionDisabled')}
              >
                <span className="inline-flex">
                  <AkButton
                    variant="outlined"
                    color="neutral"
                    disabled={decommissioned}
                    onClick={() => setAddToInventory(false)}
                  >
                    {akMT('storeknox.ignoreApp')}
                  </AkButton>
                </span>
              </AkTooltip>

              <AkTooltip
                arrow
                disabled={!addDisabled}
                title={
                  decommissioned
                    ? akMT('storeknox.decommissionedActionDisabled')
                    : akMT('storeknox.fakeApps.cannotIgnoreNonAppStoreAndPlayStoreApps')
                }
              >
                <span className="inline-flex">
                  <AkButton
                    variant="outlined"
                    color="neutral"
                    disabled={addDisabled}
                    onClick={() => setAddToInventory(true)}
                  >
                    {akMT('storeknox.ignoreAddToInventory')}
                  </AkButton>
                </span>
              </AkTooltip>
            </>
          )}
        </div>
      </div>

      <div className="flex w-full gap-2 border border-t-0 border-border bg-background px-4 py-2">
        {!ignored && (
          <span className="flex items-center gap-2 rounded-sm bg-background-subtle px-3 py-1">
            <span
              aria-hidden="true"
              className={cn('size-3.5 rounded-xs', brandAbuse ? 'bg-brand-abuse' : 'bg-fake-app')}
            />

            <AkTypography fontWeight="medium">
              {brandAbuse ? akMT('storeknox.brandAbuse') : akMT('storeknox.fakeApps.fakeApp')}
            </AkTypography>
          </span>
        )}

        <span className="flex items-center gap-2 rounded-sm bg-background-subtle px-3 py-1">
          <SkPlatformLabel android={android} />
        </span>

        <span className="flex items-center gap-2 rounded-sm bg-background-subtle px-3 py-1">
          <FakeAppStoreIcon store={fakeApp.store} />

          <AkTypography fontWeight="medium">{fakeApp.store.name}</AkTypography>
        </span>
      </div>

      <IgnoreDrawer
        skAppId={skInventoryApp.id}
        fakeApp={fakeApp}
        addToInventory={addToInventory === true}
        open={addToInventory !== null}
        onClose={() => setAddToInventory(null)}
      />
    </section>
  );
}
