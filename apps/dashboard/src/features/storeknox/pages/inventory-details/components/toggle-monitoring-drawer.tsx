import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { StoreknoxService } from '@irene/api/services/storeknox';
import { unlessRateLimited } from '@irene/api/utils/errors';
import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkDrawer, AkDrawerContent, AkDrawerHeader } from '@irene/ui/ak-drawer';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';
import ThumbsUpIcon from '@irene/ui/svgs/thumbs-up-icon.svg?react';

import { skSubscriptionOptions } from '@/features/storeknox/queries/inventory';
import { skErrorMessage } from '@/features/storeknox/utils/error-message';

/** Marks that this browser asked support for more licences, until licences are back; irene used `storeknox_credit_request`. */
export const CREDIT_REQUEST_STORAGE_KEY = 'irene:storeknox-credit-request';

const _readCreditRequest = () => {
  try {
    return window.localStorage.getItem(CREDIT_REQUEST_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

const _writeCreditRequest = (requested: boolean) => {
  try {
    if (requested) {
      window.localStorage.setItem(CREDIT_REQUEST_STORAGE_KEY, 'true');
    } else {
      window.localStorage.removeItem(CREDIT_REQUEST_STORAGE_KEY);
    }
  } catch {
    /* Storage can be unavailable; the request has still been sent. */
  }
};

interface CloseOnUnmountProps {
  isOpen: boolean;
  onUnmount: () => void;
}

/** Calls `onUnmount` when the panel leaves the DOM, which happens after its closing animation. */
function CloseOnUnmount({ isOpen, onUnmount }: Readonly<CloseOnUnmountProps>) {
  const latestProps = useRef({ isOpen, onUnmount });

  useEffect(() => {
    latestProps.current = { isOpen, onUnmount };
  });

  useEffect(
    () => () => {
      /* A panel still marked open is being torn down by the page, not closed. */
      if (!latestProps.current.isOpen) {
        latestProps.current.onUnmount();
      }
    },
    []
  );

  return null;
}

interface ToggleMonitoringDrawerProps {
  organizationId: number | string;
  onConfirm: () => void;
  onCancel: () => void;
  onClosed: () => void;
}

/**
 * Asks before turning monitoring on for an unlicensed app, or offers to ask support when none are left.
 * Mounting it opens it, so each opening refetches the subscription; `onClosed` runs after the closing
 * animation, and the backdrop does not close it, so the switch is never left between states.
 */
export function ToggleMonitoringDrawer({
  organizationId,
  onConfirm,
  onCancel,
  onClosed,
}: Readonly<ToggleMonitoringDrawerProps>) {
  const [isOpen, setIsOpen] = useState(true);
  const [requestedCredits, setRequestedCredits] = useState(_readCreditRequest);

  const subscriptionQuery = useQuery({
    ...skSubscriptionOptions(organizationId),
    enabled: Boolean(organizationId),
    refetchOnMount: 'always',
  });

  const subscription = subscriptionQuery.data;
  const isLoadingSubscription = subscriptionQuery.isFetching;
  const availableLicenses = subscription?.licenses_remaining ?? 0;
  const noLicensesAvailable = subscription?.licenses_remaining === 0;

  /* Only the reply fetched for this opening says licences are back, never an older cached one. */
  const licensesAreBack =
    subscriptionQuery.isFetchedAfterMount &&
    subscriptionQuery.isSuccess &&
    !isLoadingSubscription &&
    !noLicensesAvailable;

  const hasContactedSupport = requestedCredits && !licensesAreBack;

  /* Syncs the stored request to the fresh count; the request itself is never fetched here. */
  useEffect(() => {
    if (licensesAreBack) {
      _writeCreditRequest(false);
    }
  }, [licensesAreBack]);

  const close = (then: () => void) => {
    then();
    setIsOpen(false);
  };

  const contactSupport = useMutation({
    mutationFn: () => StoreknoxService.requestCredits(),
    onSuccess: () => {
      _writeCreditRequest(true);
      setRequestedCredits(true);
    },
    onError: unlessRateLimited((error) =>
      akNotify.error(skErrorMessage(error, akMT('pleaseTryAgain')))
    ),
  });

  const confirm = () => {
    if (noLicensesAvailable) {
      contactSupport.mutate();
    } else {
      close(onConfirm);
    }
  };

  return (
    <AkDrawer open={isOpen} onOpenChange={(next) => !next && close(onCancel)}>
      <AkDrawerContent
        className="w-125 max-w-full"
        onInteractOutside={(event) => event.preventDefault()}
        data-test-sk-toggle-monitoring-drawer
      >
        <AkDrawerHeader title={akMT('confirmation')} closeLabel={akMT('close')} />

        {isLoadingSubscription ? (
          <div className="flex flex-col gap-2 px-6 py-4">
            <AkSkeleton width="100%" height="17px" />

            <AkSkeleton width="50%" height="17px" />
          </div>
        ) : (
          <div className="flex flex-col px-6 py-4">
            {hasContactedSupport ? (
              <>
                <ThumbsUpIcon aria-hidden="true" className="mb-4" />

                <AkTypography className="w-4/5">
                  <AkMessageTranslate id="storeknox.creditRequestSuccess" />
                </AkTypography>
              </>
            ) : (
              <AkTypography className="mb-9">
                {noLicensesAvailable
                  ? akMT('storeknox.noLicensesAvailable', { availableLicenses })
                  : akMT('storeknox.licenseAllocationNote', { availableLicenses })}
              </AkTypography>
            )}
          </div>
        )}

        <AkDivider color="dark" />

        <div className="flex items-center gap-3 p-4">
          {!hasContactedSupport && (
            <AkButton
              className="capitalize"
              loading={isLoadingSubscription || contactSupport.isPending}
              onClick={confirm}
            >
              {noLicensesAvailable ? akMT('contactSupport') : `${akMT('yes')}, ${akMT('turnOn')}`}
            </AkButton>
          )}

          <AkButton variant="outlined" color="neutral" onClick={() => close(onCancel)}>
            {noLicensesAvailable ? akMT('close') : akMT('cancel')}
          </AkButton>
        </div>

        <CloseOnUnmount isOpen={isOpen} onUnmount={onClosed} />
      </AkDrawerContent>
    </AkDrawer>
  );
}
