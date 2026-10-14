import { Link } from '@tanstack/react-router';
import { Fragment, useState, type ComponentType, type SVGProps } from 'react';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkPopover, AkPopoverContent, AkPopoverTrigger } from '@irene/ui/ak-popover';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';
import AppknoxLogo from '@irene/ui/svgs/ak-icon.svg?react';
import StoreknoxLogo from '@irene/ui/svgs/sk-icon.svg?react';

import {
  buildProductFeatures,
  type ProductFeature,
  type ProductFeatureId,
} from '@/features/dashboard/utils/product-features';

import { useOrganization } from '@/hooks/use-organization';
import { useProductFeatureId } from '@/hooks/use-product-feature-id';
import { useServerConfiguration } from '@/hooks/use-server-configuration';
import { useWhitelabel } from '@/hooks/use-whitelabel';
import { closeFreshchat } from '@/scripts/freshchat';

interface ProductSwitcherProps {
  isCollapsed: boolean;
  className?: string;
}

/*
  An Appknox install names its own products, so the switcher carries their
  logos. A whitelabel install names them for what they do, and carries the
  indicators the landing page uses.
*/
const PRODUCT_LOGOS: Partial<Record<ProductFeatureId, ComponentType<SVGProps<SVGSVGElement>>>> = {
  appknox: AppknoxLogo,
  storeknox: StoreknoxLogo,
} as const;

/**
 * Moves between the products this account may open, without going back to the
 * landing page for them.
 *
 * It offers what the landing page offers, read from the same rules, so a
 * product that is not on a card is not in here either.
 *
 * @param props.isCollapsed - Whether the navigation shows icons alone.
 * @param props.className - The row every control in the navigation shares.
 */
export function ProductSwitcher({ isCollapsed, className }: Readonly<ProductSwitcherProps>) {
  /* The product being shown is left out: there is nothing to switch to in it. */
  const currentProduct = useProductFeatureId();

  const [isOpen, setIsOpen] = useState(false);
  const { isEnterprise } = useServerConfiguration();
  const { isAppknoxUrl } = useWhitelabel();

  const organization = useOrganization();
  const features = organization.features();

  const productFeatures = buildProductFeatures({
    hasStoreknox: features.storeknox,
    showsOffensiveSecurity: organization.showsOffensiveSecurity(),
    hasReporting: organization.aiFeatures().reporting,
    hasSecurityPermission: organization.hasSecurityPermission(),
    isEnterprise,
    isAppknoxUrl,
  });

  /* No tooltip: a trigger wrapped in one never receives the handler the popover injects. */
  return (
    <AkPopover open={isOpen} onOpenChange={setIsOpen}>
      <AkPopoverTrigger asChild>
        <button
          type="button"
          aria-label={akMT('appSwitcher')}
          onClick={closeFreshchat}
          className={cn(className, 'cursor-pointer')}
          data-test-product-switcher
        >
          <AkIcon name="material-symbols:apps" className="size-5 shrink-0 text-foreground" />

          {!isCollapsed && (
            <Fragment>
              <AkTypography tag="span" variant="body2" className="flex-1 text-left" noWrap>
                {akMT('appSwitcher')}
              </AkTypography>

              <AkIcon
                name="material-symbols:chevron-right"
                className="size-5 shrink-0 text-foreground"
              />
            </Fragment>
          )}
        </button>
      </AkPopoverTrigger>

      <AkPopoverContent side="right" align="start" className="w-50 border-border p-0" arrow>
        <AkTypography
          tag="h2"
          fontWeight="bold"
          className="border-b border-border bg-divider p-3.5 text-sm uppercase"
        >
          <AkMessageTranslate id="switchTo" />
        </AkTypography>

        {productFeatures
          .filter((productFeature) => productFeature.id !== currentProduct)
          .map((productFeature) => (
            <ProductSwitcherItem
              key={productFeature.id}
              productFeature={productFeature}
              onNavigate={() => setIsOpen(false)}
              indicator={
                (isAppknoxUrl && PRODUCT_LOGOS[productFeature.id]) || productFeature.indicator
              }
            />
          ))}
      </AkPopoverContent>
    </AkPopover>
  );
}

/** The classes every entry shares, whichever kind of link it is. */
const PRODUCT_SWITCHER_ITEM_ENTRY = cn(
  'flex items-center gap-2 border-t border-divider px-3.5 py-2.75 hover:bg-hover-light'
);

/**
 * One product in the switcher.
 *
 * @param props.productFeature - Where it leads and what it is called.
 * @param props.indicator - The mark beside the name, which the install decides.
 * @param props.onNavigate - Closes the panel once a product is chosen.
 */
function ProductSwitcherItem({
  productFeature,
  indicator: Indicator,
  onNavigate,
}: Readonly<{
  productFeature: ProductFeature;
  indicator: ComponentType<SVGProps<SVGSVGElement>>;
  onNavigate: () => void;
}>) {
  const { destination, title, opensInNewTab } = productFeature;

  const contents = (
    <Fragment>
      <Indicator className="size-6 shrink-0" role="presentation" />

      <AkTypography tag="span" variant="body2" noWrap>
        {title}
      </AkTypography>
    </Fragment>
  );

  if (destination.kind === 'route') {
    return (
      <Link
        to={destination.to}
        onClick={onNavigate}
        className={cn(PRODUCT_SWITCHER_ITEM_ENTRY)}
        data-test-product-switcher-item={productFeature.id}
      >
        {contents}
      </Link>
    );
  }

  return (
    <a
      href={destination.href}
      target={opensInNewTab ? '_blank' : undefined}
      rel={opensInNewTab ? 'noopener noreferrer' : undefined}
      onClick={onNavigate}
      className={cn(PRODUCT_SWITCHER_ITEM_ENTRY)}
      data-test-product-switcher-item={productFeature.id}
    >
      {contents}
    </a>
  );
}
