import { Fragment } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkTypography } from '@irene/ui/ak-typography';

interface IntegratedAccountProps {
  logo: string;
  logoAlt: string;
  propertyTitle: string;
  property: string;

  /** The instance the connection points at, for a service that is hosted per customer. */
  hostUrl?: string;
  isLoading?: boolean;
  onEdit?: () => void;
}

/**
 * What a connection amounts to: the service, where it points, and which account it is held under.
 *
 * @param props.logo - The service's mark.
 * @param props.logoAlt - What the mark reads as, for a screen reader.
 * @param props.propertyTitle - What the value below the instance is, such as the username.
 * @param props.property - That value.
 * @param props.hostUrl - The instance the connection points at, where the service has one.
 * @param props.isLoading - Holds the block's shape while the connection is read.
 * @param props.onEdit - Offers the way to change the connection, and is called by it.
 */
export function IntegratedAccount({
  logo,
  logoAlt,
  propertyTitle,
  property,
  hostUrl,
  isLoading = false,
  onEdit,
}: Readonly<IntegratedAccountProps>) {
  return (
    <div
      className="flex min-w-87.5 justify-between rounded-xs border border-border p-3.5"
      data-test-integrated-account
    >
      <div className="flex flex-col gap-3.5">
        <div className="flex size-10 items-center justify-center rounded-full border border-border">
          {isLoading ? (
            <AkSkeleton variant="circular" className="size-10" />
          ) : (
            <img src={logo} alt={logoAlt} className="size-10" data-test-integrated-account-logo />
          )}
        </div>

        {isLoading ? (
          <Fragment>
            <AkSkeleton className="h-4.75 w-47.5" />

            <AkSkeleton className="h-4.75 w-22.5" />
          </Fragment>
        ) : (
          <div className="flex flex-col gap-1.75">
            {hostUrl !== undefined && (
              <div className="flex flex-col gap-1.5">
                <AkTypography variant="subtitle2">{akMT('instanceURL')}</AkTypography>

                <AkTypography color="textSecondary" data-test-integrated-account-host>
                  {hostUrl}
                </AkTypography>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <AkTypography variant="subtitle2">{propertyTitle}</AkTypography>

              <AkTypography color="textSecondary" data-test-integrated-account-property>
                {property}
              </AkTypography>
            </div>
          </div>
        )}
      </div>

      {onEdit && (
        <AkIconButton
          variant="outlined"
          onClick={onEdit}
          aria-label={akMT('edit')}
          title={akMT('edit')}
          data-test-integrated-account-edit
        >
          <AkIcon name="material-symbols:edit" />
        </AkIconButton>
      )}
    </div>
  );
}
