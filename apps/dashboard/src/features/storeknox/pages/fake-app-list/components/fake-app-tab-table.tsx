import { Link, useNavigate } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { ENUMS } from '@irene/enums';
import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkTable } from '@irene/ui/ak-table';
import { createAkTableColumns } from '@irene/ui/ak-table/helpers';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';
import type { ApiSkFakeApp } from '@irene/api/services/storeknox';

import { FakeAppStoreIcon } from '@/features/storeknox/components/fake-app-store-icon';
import { SkRoundAppIcon } from '@/features/storeknox/components/sk-round-app-icon';
import { ireneColumnShares } from '@/features/storeknox/utils/column-widths';
import { fakeAppConfidence } from '@/features/storeknox/utils/fake-app';

interface FakeAppTabTableProps {
  skAppId: string;
  /** The copies to show; undefined while the page loads, which shows placeholder rows. */
  apps?: ApiSkFakeApp[];
  /** Dims the rows while the next page loads over the last one. */
  busy?: boolean;
  /** How many placeholder rows to draw while the page loads. */
  loadingRowCount?: number;
  /** The action cell of a row; no action column is drawn without it. */
  renderAction?: (app: ApiSkFakeApp) => ReactNode;
}

/** A table row: a copy, or a loading placeholder when it has none. */
interface FakeAppRow {
  app?: ApiSkFakeApp;
}

/* irene's five placeholder rows, for a page whose size nothing knows yet. */
const DEFAULT_LOADING_ROWS = 5;

const column = createAkTableColumns<FakeAppRow>();

/* irene's px widths, read as ratios: platform, store, logo, app name, namespace, developer, confidence, action. */
const SHARES_WITH_ACTION = ireneColumnShares([80, 80, 80, 250, 200, 200, 100, 80]);
const SHARES_WITHOUT_ACTION = ireneColumnShares([80, 80, 80, 250, 200, 200, 100]);

/**
 * The copies one tab lists: platform, store, logo, name, namespace, developer and the AI's
 * confidence, with a row opening the copy's details. A tab adds an action column through
 * `renderAction`; the Ignored tab leaves it out.
 *
 * @param props.skAppId - The inventory app the copies belong to, for the details link.
 * @param props.apps - The page of copies; undefined while loading.
 * @param props.busy - Whether the page shown is the last one while the next loads.
 * @param props.loadingRowCount - How many placeholder rows to draw while loading.
 * @param props.renderAction - The action cell for a copy.
 */
export function FakeAppTabTable({
  skAppId,
  apps,
  busy = false,
  loadingRowCount = DEFAULT_LOADING_ROWS,
  renderAction,
}: Readonly<FakeAppTabTableProps>) {
  const navigate = useNavigate();
  const isLoading = apps === undefined;
  const shares = renderAction ? SHARES_WITH_ACTION : SHARES_WITHOUT_ACTION;

  const openDetails = (app: ApiSkFakeApp) =>
    navigate({
      to: '/dashboard/storeknox/fake-apps/$skApp/details/$appId',
      params: { skApp: skAppId, appId: String(app.id) },
    });

  const columns = column.columns([
    column.display({
      id: 'platform',
      header: () => akMT('platform'),
      cell: ({ row: { original } }) =>
        original.app ? (
          <span role="img" aria-label={original.app.store.platform_display} className="inline-flex">
            <AkIcon
              name={
                original.app.store.platform === ENUMS.PLATFORM.ANDROID
                  ? 'material-symbols:android'
                  : 'fa-brands:apple'
              }
              className={cn(
                'size-5',
                original.app.store.platform === ENUMS.PLATFORM.ANDROID ? 'text-android' : 'text-ios'
              )}
            />
          </span>
        ) : (
          <AkSkeleton variant="circular" width="20px" height="20px" className="mx-auto" />
        ),
      meta: { width: shares[0], align: 'center' },
    }),

    column.display({
      id: 'store',
      header: () => <AkMessageTranslate id="storeknox.store" />,
      cell: ({ row: { original } }) =>
        original.app ? (
          <span className="inline-flex justify-center">
            <FakeAppStoreIcon store={original.app.store} />
          </span>
        ) : (
          <AkSkeleton variant="circular" width="16px" height="16px" className="mx-auto" />
        ),
      meta: { width: shares[1], align: 'center' },
    }),

    column.display({
      id: 'logo',
      header: () => <AkMessageTranslate id="storeknox.fakeApps.logo" />,
      cell: ({ row: { original } }) =>
        original.app ? (
          <SkRoundAppIcon
            src={original.app.fake_app_icon_url}
            alt=""
            className="size-8 border border-border object-cover"
          />
        ) : (
          <AkSkeleton variant="circular" width="32px" height="32px" />
        ),
      meta: { width: shares[2] },
    }),

    column.display({
      id: 'app-name',
      header: () => akMT('appName'),
      cell: ({ row: { original } }) =>
        original.app ? (
          <Link
            to="/dashboard/storeknox/fake-apps/$skApp/details/$appId"
            params={{ skApp: skAppId, appId: String(original.app.id) }}
            className="block max-w-55"
            onClick={(event) => event.stopPropagation()}
          >
            <AkTypography
              noWrap
              fontWeight="medium"
              color="secondary"
              underline="always"
              title={original.app.title}
            >
              {original.app.title}
            </AkTypography>
          </Link>
        ) : (
          <AkSkeleton width="160px" height="16px" />
        ),
      meta: { width: shares[3] },
    }),

    column.display({
      id: 'namespace',
      header: () => akMT('namespace'),
      cell: ({ row: { original } }) =>
        original.app ? (
          <AkTypography noWrap title={original.app.package_name}>
            {original.app.package_name}
          </AkTypography>
        ) : (
          <AkSkeleton width="160px" height="16px" />
        ),
      meta: { width: shares[4] },
    }),

    column.display({
      id: 'developer',
      header: () => akMT('developer'),
      cell: ({ row: { original } }) =>
        original.app ? (
          <AkTypography noWrap title={original.app.dev_name}>
            {original.app.dev_name}
          </AkTypography>
        ) : (
          <AkSkeleton width="120px" height="16px" />
        ),
      meta: { width: shares[5] },
    }),

    column.display({
      id: 'confidence',
      header: () => <AkMessageTranslate id="storeknox.fakeApps.confidence" />,
      cell: ({ row: { original } }) =>
        original.app ? (
          <AkTypography color="primary" fontWeight="medium">
            {/* irene reads a missing score as 0. */}
            {fakeAppConfidence(original.app) ?? 0}%
          </AkTypography>
        ) : (
          <AkSkeleton width="50px" height="16px" />
        ),
      meta: { width: shares[6] },
    }),

    ...(renderAction
      ? [
          column.display({
            id: 'action',
            header: () => akMT('action'),
            cell: ({ row: { original } }) =>
              original.app ? (
                renderAction(original.app)
              ) : (
                <AkSkeleton variant="circular" width="24px" height="24px" className="mx-auto" />
              ),
            meta: { width: shares[7], align: 'center' as const },
          }),
        ]
      : []),
  ]);

  return (
    <AkTable
      columns={columns}
      data={
        apps
          ? apps.map((app): FakeAppRow => ({ app }))
          : Array.from({ length: loadingRowCount }, (): FakeAppRow => ({}))
      }
      aria-busy={busy}
      wrapperClassName={cn(busy && 'opacity-60')}
      hoverable={!isLoading}
      caption={akMT('storeknox.fakeAppsTitle')}
      onRowClick={isLoading ? undefined : (row) => row.app && openDetails(row.app)}
    />
  );
}
