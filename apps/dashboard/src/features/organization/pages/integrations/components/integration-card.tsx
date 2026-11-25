import { Fragment } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkChip } from '@irene/ui/ak-chip';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkTypography } from '@irene/ui/ak-typography';

/** What a card says about one service. */
export interface IntegrationCardData {
  id: string;
  title: string;
  description: string;
  logo: string;
  isIntegrated: boolean;

  /** Replaces the state and the manage control with one control of its own. */
  showSelectButton?: boolean;
  selectButtonText?: string;
}

interface IntegrationCardProps {
  data: IntegrationCardData;
  isLoading?: boolean;
  onIntegrate: () => void;
}

/** The card's own shape, held while the connection is still being read. */
function IntegrationCardSkeleton() {
  return (
    <div
      className="m-3.5 flex h-65 w-75 flex-col gap-3.5 rounded-xs border border-border p-3.5"
      data-test-integration-card-loading
    >
      <AkSkeleton variant="circular" className="size-17.5" />

      <AkSkeleton className="h-4.75 w-20" />

      <AkSkeleton className="h-13.75 w-62.5" />

      <AkDivider />

      <AkSkeleton className="h-4.75 w-20" />
    </div>
  );
}

/**
 * One service the organization may connect itself to.
 *
 * A connected service reads as connected and offers the way to manage it; one
 * that is not offers the way to connect. A service that leaves the card for a
 * choice of its own — a project, a channel — says so through `showSelectButton`
 * and carries that one control instead.
 *
 * @param props.data - What the card says, and whether the service is connected.
 * @param props.isLoading - Holds the card's shape while the connection is read.
 * @param props.onIntegrate - Called by every control on the card: connect, manage and select.
 */
export function IntegrationCard({
  data,
  isLoading = false,
  onIntegrate,
}: Readonly<IntegrationCardProps>) {
  if (isLoading) {
    return <IntegrationCardSkeleton />;
  }

  return (
    <div
      className="m-3.5 flex h-65 w-75 flex-col justify-between rounded-xs border border-border"
      data-test-integration-card={data.id}
    >
      <div className="flex flex-col gap-1.75 p-3.5">
        <div
          className="flex size-17.5 items-center justify-center rounded-full border border-border"
          data-test-integration-card-logo
        >
          <img src={data.logo} alt="" className="h-auto w-full rounded-full" />
        </div>

        <AkTypography variant="subtitle1" data-test-integration-card-title={data.id}>
          {data.title}
        </AkTypography>

        <AkTypography color="textSecondary" data-test-integration-card-description={data.id}>
          {data.description}
        </AkTypography>
      </div>

      <div className="flex w-full flex-col">
        <AkDivider />

        <div className="flex w-full items-center justify-between">
          {data.isIntegrated && data.showSelectButton && (
            <AkButton
              variant="outlined"
              className="m-3.5"
              onClick={onIntegrate}
              data-test-integration-card-select
            >
              {data.selectButtonText}
            </AkButton>
          )}

          {data.isIntegrated && !data.showSelectButton && (
            <Fragment>
              <AkChip
                variant="semi-filled-outlined"
                color="success"
                label={akMT('integrated')}
                className="m-3.5"
                icon={<AkIcon name="material-symbols:check-circle" className="text-success" />}
                data-test-integration-card-integrated
              />

              <AkButton
                variant="outlined"
                color="neutral"
                className="m-3.5"
                onClick={onIntegrate}
                leftIcon={<AkIcon name="material-symbols:settings" />}
                data-test-integration-card-manage
              >
                {akMT('manage')}
              </AkButton>
            </Fragment>
          )}

          {!data.isIntegrated && (
            <AkButton
              variant="outlined"
              color="neutral"
              className="m-3.5"
              onClick={onIntegrate}
              leftIcon={<AkIcon name="material-symbols:add" />}
              data-test-integration-card-connect
            >
              {akMT('connect')}
            </AkButton>
          )}
        </div>
      </div>
    </div>
  );
}
