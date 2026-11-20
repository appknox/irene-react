import { useQuery } from '@tanstack/react-query';

import { getConfigFlag } from '@irene/config';
import { akMT } from '@irene/translations/intl';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkTypography } from '@irene/ui/ak-typography';

import { LicenseDetail } from '@/features/billing/components/license-detail';
import { OrganizationBilling } from '@/features/billing/components/organization-billing';
import { licenseOptions } from '@/features/billing/queries/billing';
import { useOrganization } from '@/hooks/use-organization';

/**
 * The billing page.
 *
 * A self-hosted deployment that shows its license (`IRENE_SHOW_LICENSE`) shows
 * the license in place of billing, as long as the organization's billing is
 * not hidden and the server has a license to show. Every other deployment
 * shows the organization's subscription, plans and invoices.
 */
export function BillingPage() {
  const { selected, selectedId } = useOrganization();
  const organizationId = selectedId();
  const showsLicense = getConfigFlag('IRENE_SHOW_LICENSE');

  const license = useQuery({
    ...licenseOptions(organizationId),
    enabled: showsLicense && Boolean(organizationId),
  });

  const showsBilling = !selected?.billing_hidden;
  const isLoadingLicense = showsLicense && license.isPending;

  return (
    <div
      className="mx-auto flex w-full max-w-300 flex-col gap-5.25 px-6 pt-4 pb-6"
      data-test-billing
    >
      <AkTypography tag="h1" variant="h4" className="mt-1.75 text-xl">
        {akMT('billing')}
      </AkTypography>

      {isLoadingLicense && <AkSkeleton height="240px" data-test-license-loading />}

      {!isLoadingLicense &&
        (showsBilling && license.data ? (
          <LicenseDetail license={license.data} />
        ) : (
          <OrganizationBilling organizationId={organizationId} />
        ))}
    </div>
  );
}
