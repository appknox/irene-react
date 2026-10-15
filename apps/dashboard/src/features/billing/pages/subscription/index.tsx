import { useQuery } from '@tanstack/react-query';

import { akMT } from '@irene/translations/intl';
import { AkAlert, AkAlertDescription } from '@irene/ui/ak-alert';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiSubscriptionInfo } from '@irene/api/services/billing';

import { BillingSection } from '@/features/billing/components/billing-section';
import { subscriptionInfoOptions } from '@/features/billing/queries/billing';
import { formatBillingDate, hasPassed, isEndingSoon } from '@/features/billing/utils';
import { useOrganization } from '@/hooks/use-organization';

/** What irene shows for a value the subscription does not set. */
const NO_VALUE = '-';

/** The share of procured licenses at or under which the few left are called out. */
const FEW_LICENSES_SHARE = 0.1;

/**
 * What an owner should know before reading the figures: the term has ended or
 * is about to, and the licenses have run out or nearly. Each is the reason new
 * apps stop being accepted.
 *
 * @param props.info - The term and counts.
 */
function SubscriptionWarnings({ info }: Readonly<{ info: ApiSubscriptionInfo }>) {
  const endDate = formatBillingDate(info.expiry_date);
  const hasEnded = hasPassed(info.expiry_date);
  const endsSoon = isEndingSoon(info.expiry_date);
  const remaining = info.licenses_remaining;
  const procured = info.original_licenses;

  const hasNoLicensesLeft = remaining === 0;

  const hasFewLicensesLeft =
    remaining !== null && remaining > 0 && !!procured && remaining <= procured * FEW_LICENSES_SHARE;

  return (
    <>
      {hasEnded && (
        <AkAlert variant="error" data-test-subscription-term-ended>
          <AkIcon name="material-symbols:error" />

          <AkAlertDescription>
            {akMT('subscriptionTermEndedWarning', { date: endDate })}
          </AkAlertDescription>
        </AkAlert>
      )}

      {endsSoon && (
        <AkAlert variant="warning" data-test-subscription-term-ending>
          <AkIcon name="material-symbols:warning" />

          <AkAlertDescription>
            {akMT('subscriptionTermEndingWarning', { date: endDate })}
          </AkAlertDescription>
        </AkAlert>
      )}

      {hasNoLicensesLeft && (
        <AkAlert variant="error" data-test-subscription-no-licenses>
          <AkIcon name="material-symbols:error" />

          <AkAlertDescription>{akMT('noLicensesLeftWarning')}</AkAlertDescription>
        </AkAlert>
      )}

      {hasFewLicensesLeft && (
        <AkAlert variant="warning" data-test-subscription-few-licenses>
          <AkIcon name="material-symbols:warning" />

          <AkAlertDescription>
            {akMT('fewLicensesLeftWarning', { count: remaining, total: procured })}
          </AkAlertDescription>
        </AkAlert>
      )}
    </>
  );
}

/**
 * The subscription term and license counts, as four labelled figures.
 *
 * @param props.info - The term and counts.
 */
function SubscriptionDetails({ info }: Readonly<{ info: ApiSubscriptionInfo }>) {
  const figures = [
    {
      id: 'start',
      label: akMT('subscriptionStartDate'),
      value: formatBillingDate(info.start_date),
    },
    { id: 'end', label: akMT('subscriptionEndDate'), value: formatBillingDate(info.expiry_date) },
    { id: 'procured', label: akMT('licensesProcured'), value: info.original_licenses },
    { id: 'remaining', label: akMT('licensesRemaining'), value: info.licenses_remaining },
  ];

  return (
    <dl className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      {figures.map((figure) => (
        <div
          key={figure.id}
          className="flex flex-col gap-1 rounded-sm bg-background-subtle p-4"
          data-test-subscription-figure={figure.id}
        >
          <AkTypography tag="dt" variant="body2" color="textSecondary">
            {figure.label}
          </AkTypography>

          <AkTypography tag="dd" variant="h5">
            {figure.value === null || figure.value === '' ? NO_VALUE : figure.value}
          </AkTypography>
        </div>
      ))}
    </dl>
  );
}

/**
 * The subscription page: the term an organization's subscription runs for and
 * how many of its licenses are left, for an owner whose organization has the
 * page turned on. The route sends anyone else to the projects.
 *
 * Warnings sit above the figures when the term or the licenses are running
 * out. Where the server has nothing to show, the page says so in place of the
 * card.
 */
export function SubscriptionPage() {
  const organizationId = useOrganization().selectedId();
  const info = useQuery(subscriptionInfoOptions(organizationId));

  return (
    <div
      className="mx-auto flex w-full max-w-300 flex-col gap-5.25 px-6 pt-4 pb-6"
      data-test-subscription-page
    >
      <AkTypography tag="h1" variant="h4" className="mt-1.75 text-xl">
        {akMT('subscription')}
      </AkTypography>

      {info.isPending && <AkSkeleton height="200px" data-test-subscription-info-loading />}

      {info.isSuccess && info.data && (
        <BillingSection
          title={akMT('subscriptionDetails')}
          description={akMT('subscriptionDetailsSubtitle')}
        >
          <SubscriptionWarnings info={info.data} />

          <SubscriptionDetails info={info.data} />
        </BillingSection>
      )}

      {info.isSuccess && !info.data && (
        <div
          className="
            flex flex-col items-center gap-2.5 rounded-sm border border-border bg-background px-5.25
            py-9.75
          "
          data-test-subscription-not-available
        >
          <AkIcon name="material-symbols:info" className="size-6 text-foreground-muted" />

          <AkTypography variant="subtitle1">{akMT('subscriptionNotAvailable')}</AkTypography>
        </div>
      )}
    </div>
  );
}
