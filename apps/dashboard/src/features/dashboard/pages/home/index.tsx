import { useMemo } from 'react';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkButton } from '@irene/ui/ak-button';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';

import { AppLogo } from '@/components/app-logo';
import { useLogout } from '@/features/auth/hooks/use-logout';
import { ProductFeatureCard } from '@/features/dashboard/pages/home/components/product-feature-card';
import { buildProductFeatures } from '@/features/dashboard/pages/home/product-features';
import { useOrganization } from '@/hooks/use-organization';
import { useServerConfiguration } from '@/hooks/use-server-configuration';
import { useWhitelabel } from '@/hooks/use-whitelabel';

/**
 * Where an account lands once signed in, when it has more than one product to
 * choose between. An account with only one is sent straight into it by the
 * route's own guard rather than shown a page with a single card.
 */
export function HomePage() {
  const logout = useLogout();
  const { isAppknoxUrl, favicon, logo } = useWhitelabel();
  const { selected, me } = useOrganization();
  const { isEnterprise } = useServerConfiguration();

  const productFeatures = useMemo(() => {
    const hasOffensiveSecurity = Boolean(selected?.features.offensive_security);

    const hidesOffensiveSecurityUpsell =
      !hasOffensiveSecurity && Boolean(selected?.hide_upsell_features);

    return buildProductFeatures({
      hasStoreknox: Boolean(selected?.features.storeknox),
      hasOffensiveSecurity,
      hasReporting: Boolean(selected?.ai_features.reporting),
      hasSecurityPermission: Boolean(me?.has_security_permission),
      hidesOffensiveSecurityUpsell,
      isEnterprise,
      isAppknoxUrl,
    });
  }, [selected, me, isEnterprise, isAppknoxUrl]);

  return (
    <main
      className="flex min-h-screen justify-center bg-background-subtle p-14"
      data-test-home-page
    >
      <div className="flex w-full max-w-300 flex-col">
        <div className="py-3.5">
          <AppLogo
            src={isAppknoxUrl ? favicon : logo}
            className={isAppknoxUrl ? 'size-10' : 'max-h-25 max-w-56.25'}
          />
        </div>

        <div className="flex flex-col gap-0.5 py-3.5">
          <AkTypography variant="h5" fontWeight="regular">
            <AkMessageTranslate id="selectThePath" />
          </AkTypography>

          <div className="flex items-center justify-between gap-4">
            <AkTypography tag="h1" variant="h2" fontWeight="bold" data-test-home-page-title>
              <AkMessageTranslate id="toSecureYourMobileApps" />
            </AkTypography>

            <AkButton
              variant="outlined"
              color="neutral"
              loading={logout.isPending}
              onClick={() => logout.mutate()}
              data-test-home-page-logout
            >
              <AkIcon name="material-symbols:logout" />

              <AkMessageTranslate id="logout" />
            </AkButton>
          </div>
        </div>

        <AkDivider className="mb-3.5" />

        <div className="flex flex-wrap gap-7 py-1.75">
          {productFeatures.map(({ id, ...productFeature }) => (
            <ProductFeatureCard key={id} {...productFeature} />
          ))}
        </div>
      </div>
    </main>
  );
}
