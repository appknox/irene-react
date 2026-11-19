import { Link } from '@tanstack/react-router';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkBreadcrumbs, AkBreadcrumbsItem } from '@irene/ui/ak-breadcrumbs';
import type { ApiSkInventoryApp } from '@irene/api/services/storeknox';

interface DetailsBreadcrumbsProps {
  app: ApiSkInventoryApp;
  current?: string;
}

/**
 * The breadcrumbs above an app's details: inventory, the app by package name, then `current`.
 * irene shows this trail only as a fallback for direct links; here every page shows it.
 */
export function DetailsBreadcrumbs({ app, current }: Readonly<DetailsBreadcrumbsProps>) {
  const detailsTitle = `${akMT('storeknox.inventoryDetails')} (${app.app_metadata.package_name})`;

  return (
    <AkBreadcrumbs aria-label={akMT('storeknox.inventoryDetails')} className="pb-6">
      <AkBreadcrumbsItem asChild>
        <Link to="/dashboard/storeknox/inventory/app-list">
          <AkMessageTranslate id="storeknox.appInventory" />
        </Link>
      </AkBreadcrumbsItem>

      {current ? (
        <AkBreadcrumbsItem asChild>
          <Link to="/dashboard/storeknox/inventory-details/$id" params={{ id: String(app.id) }}>
            {detailsTitle}
          </Link>
        </AkBreadcrumbsItem>
      ) : (
        <AkBreadcrumbsItem current>{detailsTitle}</AkBreadcrumbsItem>
      )}

      {current && <AkBreadcrumbsItem current>{current}</AkBreadcrumbsItem>}
    </AkBreadcrumbs>
  );
}
