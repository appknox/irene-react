import { getRouteApi, Link, useLocation } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkBreadcrumbs, AkBreadcrumbsItem } from '@irene/ui/ak-breadcrumbs';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiSkThirdPartyApp } from '@irene/api/services/storeknox';

import { SkPlatformLabel } from '@/features/storeknox/components/sk-platform-label';
import { SkRoundAppIcon } from '@/features/storeknox/components/sk-round-app-icon';
import { SkStoreLabel } from '@/features/storeknox/components/sk-store-label';

import { VersionSelect } from './version-select';

interface DetailsHeaderProps {
  app: ApiSkThirdPartyApp;

  /** The region the page resolved, which the breadcrumb returns to when no list search came with the link. */
  region: string;

  /** The scanned version on screen: the one the URL names when the app has it, else the app's own. */
  selectedVersion: string;
}

const routeApi = getRouteApi('/_authenticated/dashboard_/storeknox/third-party-scans/$packageName');

/**
 * The header of a third-party app's details: the breadcrumb trail from the list, the app's icon,
 * title, package and developer, a select for the scanned version (only when the app has any) and
 * chips for its platform and store. A title-less app is named by its package.
 *
 * The breadcrumb returns to the list with the search the list navigated here with (its store,
 * region, risk status, search text and page); a deep link carries none, so it goes back to the
 * app's store and the resolved region.
 *
 * @param props.app - The app the page is about.
 * @param props.region - The region the page resolved.
 * @param props.selectedVersion - The version the select shows.
 */
export function DetailsHeader({ app, region, selectedVersion }: Readonly<DetailsHeaderProps>) {
  const navigate = routeApi.useNavigate();
  const listSearch = useLocation({ select: (location) => location.state.thirdPartyListSearch });
  const name = app.title || app.package_name;
  const android = app.store === 'playstore';

  return (
    <section className="w-full" aria-label={name} data-test-sk-third-party-details-header>
      <AkBreadcrumbs aria-label={akMT('storeknox.thirdPartyScansTitle')} className="pb-2">
        <AkBreadcrumbsItem asChild>
          <Link
            to="/dashboard/storeknox/third-party-scans"
            search={listSearch ?? { tp_store: app.store, tp_region: region }}
          >
            <AkMessageTranslate id="storeknox.thirdPartyScansTitle" />
          </Link>
        </AkBreadcrumbsItem>

        <AkBreadcrumbsItem current>{name}</AkBreadcrumbsItem>
      </AkBreadcrumbs>

      <div
        className="
          flex w-full items-center justify-between gap-2 border border-border bg-background p-6
        "
      >
        <div className="flex min-w-0 items-center gap-4">
          <SkRoundAppIcon src={app.icon_url} alt={name} className="size-14.5" />

          <div className="flex min-w-0 flex-col gap-1">
            <AkTypography tag="h1" variant="h5" fontWeight="bold" noWrap title={name}>
              {name}
            </AkTypography>

            <div className="flex items-center gap-2">
              <AkTypography color="textPrimary" noWrap className="max-w-62.5">
                {app.package_name}
              </AkTypography>

              <AkTypography color="textSecondary" fontWeight="bold" aria-hidden="true">
                •
              </AkTypography>

              <AkTypography color="textSecondary">{app.dev_name}</AkTypography>
            </div>
          </div>
        </div>

        {app.versions.length > 0 && (
          <VersionSelect
            versions={app.versions}
            value={selectedVersion}
            onChange={(version) =>
              navigate({ search: (previous) => ({ ...previous, tp_version: version }) })
            }
          />
        )}
      </div>

      <div className="flex w-full gap-2 border border-t-0 border-border bg-background px-4 py-2">
        <span className="flex items-center gap-2 rounded-sm bg-background-subtle px-3 py-1">
          <SkPlatformLabel android={android} />
        </span>

        <span className="flex items-center gap-2 rounded-sm bg-background-subtle px-3 py-1">
          <SkStoreLabel android={android} />
        </span>
      </div>
    </section>
  );
}
