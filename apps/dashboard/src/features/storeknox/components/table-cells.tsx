import { Link } from '@tanstack/react-router';
import { useState } from 'react';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkTypography } from '@irene/ui/ak-typography';
import AppstoreLogo from '@irene/ui/svgs/appstore-logo.svg?react';
import StoreknoxPlaystoreLogo from '@irene/ui/svgs/storeknox-playstore-logo.svg?react';
import type { ApiSkAppMetadata } from '@irene/api/services/storeknox';

import { isAndroid, isIos } from '@/features/storeknox/utils/sk-app';

/** The store listing the shared cells read; a search result is mapped into it by `discoveryResultAsCellApp`. */
export interface SkCellApp {
  app_metadata: Pick<
    ApiSkAppMetadata,
    'url' | 'icon_url' | 'package_name' | 'title' | 'platform' | 'dev_name' | 'dev_email'
  >;
}

interface SkCellProps {
  app?: SkCellApp;
  hideDevEmail?: boolean;
  detailsId?: number;
}

/** The store an app is listed in, as its logo; a skeleton while the row loads. */
export function SkStoreCell({ app }: Readonly<SkCellProps>) {
  if (!app) {
    return <AkSkeleton variant="circular" width="30px" height="30px" className="mx-auto" />;
  }

  return (
    <span className="inline-flex justify-center">
      {isIos(app) && <AppstoreLogo aria-label="App Store" data-test-sk-store-ios />}

      {isAndroid(app) && (
        <StoreknoxPlaystoreLogo aria-label="Play Store" data-test-sk-store-play-store />
      )}
    </span>
  );
}

/** An app's icon, falling back to its first letter when there is none or it fails to load. */
export function SkAppIcon({ src, title }: Readonly<{ src?: string; title: string }>) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span
        aria-hidden="true"
        className="
          flex size-10 shrink-0 items-center justify-center rounded-sm border border-border
          bg-background-subtle text-lg font-medium uppercase
        "
        data-test-sk-app-icon-fallback
      >
        {title.charAt(0)}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className="size-10 shrink-0 rounded-sm border border-border object-contain"
      onError={() => setFailed(true)}
    />
  );
}

/**
 * An app's icon, store link and package name; both links stop the click so it does not also open the row.
 *
 * @param props.detailsId - Links the package name to the app's details, giving the keyboard a way in besides the row's click.
 */
export function SkApplicationCell({ app, detailsId }: Readonly<SkCellProps>) {
  if (!app) {
    return (
      <div className="flex items-center gap-3">
        <AkSkeleton variant="rectangular" width="40px" height="40px" />

        <div className="flex flex-col gap-1">
          <AkSkeleton width="180px" height="16px" />

          <AkSkeleton width="115px" height="16px" />
        </div>
      </div>
    );
  }

  const { app_metadata: metadata } = app;

  return (
    <div className="flex items-center gap-3">
      <SkAppIcon src={metadata.icon_url} title={metadata.title} />

      <div className="flex min-w-0 flex-col gap-1">
        <a
          href={metadata.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
          onClick={(event) => event.stopPropagation()}
        >
          <AkTypography
            variant="h6"
            color="secondary"
            underline="always"
            noWrap
            title={metadata.title}
            data-test-sk-application-title
          >
            {metadata.title}
          </AkTypography>
        </a>

        {detailsId === undefined ? (
          <AkTypography
            color="neutral"
            noWrap
            title={metadata.package_name}
            data-test-sk-application-package-name
          >
            {metadata.package_name}
          </AkTypography>
        ) : (
          <Link
            to="/dashboard/storeknox/inventory-details/$id"
            params={{ id: String(detailsId) }}
            preload="intent"
            className="w-full hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            <AkTypography
              color="neutral"
              noWrap
              title={metadata.package_name}
              data-test-sk-application-package-name
            >
              {metadata.package_name}
            </AkTypography>
          </Link>
        )}
      </div>
    </div>
  );
}

/** The developer's name and email; a missing email reads "No data available" unless `hideDevEmail`. */
export function SkDeveloperCell({ app, hideDevEmail = false }: Readonly<SkCellProps>) {
  if (!app) {
    return (
      <div className="flex flex-col gap-1">
        <AkSkeleton width="180px" height="16px" />

        <AkSkeleton width="115px" height="16px" />
      </div>
    );
  }

  const { dev_name: devName, dev_email: devEmail } = app.app_metadata;

  return (
    <div className="flex flex-col gap-1">
      <AkTypography color="secondary" noWrap title={devName} data-test-sk-developer-name>
        {devName}
      </AkTypography>

      {!hideDevEmail &&
        (devEmail ? (
          <AkTypography color="neutral" noWrap title={devEmail} data-test-sk-developer-email>
            {devEmail}
          </AkTypography>
        ) : (
          <AkTypography color="neutral" noWrap className="pr-4">
            <AkMessageTranslate id="noDataAvailable" />
          </AkTypography>
        ))}
    </div>
  );
}
