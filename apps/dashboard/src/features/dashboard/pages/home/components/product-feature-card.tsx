import { Link } from '@tanstack/react-router';
import type { ComponentType, SVGProps } from 'react';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';

import type { ProductFeatureDestination } from '@/features/dashboard/pages/home/product-features';

/** The artwork a card carries: a banner behind its head, and the product's mark. */
type ProductCardArtwork = ComponentType<SVGProps<SVGSVGElement>>;

interface ProductFeatureCardProps {
  title: string;
  description: string;
  destination: ProductFeatureDestination;
  cover: ProductCardArtwork;
  indicator: ProductCardArtwork;
  opensInNewTab?: boolean;
}

/**
 * One product on the home page, and the way into it.
 *
 * @param props.title - The product, as this deployment names it.
 * @param props.description - What it is for, in a line.
 * @param props.destination - A route in this app, or another app served alongside it.
 * @param props.cover - The banner behind the card's head.
 * @param props.indicator - The product's own mark.
 * @param props.opensInNewTab - Whether the link leaves this tab, for a product served separately.
 */
export function ProductFeatureCard({
  title,
  description,
  destination,
  cover: ProductFeatureCover,
  indicator: ProductFeatureIndicator,
  opensInNewTab,
}: Readonly<ProductFeatureCardProps>) {
  return (
    <article
      className="flex max-w-78.5 flex-col overflow-hidden rounded-xs border border-border"
      data-test-product-feature-card
    >
      <ProductFeatureCover role="presentation" />

      <div className="flex max-h-50 flex-1 flex-col gap-7 bg-background p-5.25">
        <div className="flex flex-col gap-1.75">
          <ProductFeatureIndicator
            className="pointer-events-none size-10.5"
            role="presentation"
            data-test-product-feature-card-indicator
          />

          <AkTypography
            tag="h2"
            variant="h6"
            fontWeight="bold"
            data-test-product-feature-card-title
          >
            {title}
          </AkTypography>

          {/* Held at two lines so every card's link sits on the same line. */}
          <AkTypography variant="subtitle2" fontWeight="regular" className="min-h-9">
            {description}
          </AkTypography>
        </div>

        <div className="mt-auto flex items-center gap-1.75">
          {destination.kind === 'route' ? (
            <Link
              to={destination.to}
              className="font-semibold underline"
              data-test-product-feature-card-link
            >
              <AkMessageTranslate id="takeMeToDashboard" />
            </Link>
          ) : (
            <a
              href={destination.href}
              target={opensInNewTab ? '_blank' : undefined}
              rel={opensInNewTab ? 'noopener noreferrer' : undefined}
              className="font-semibold underline"
              data-test-product-feature-card-link
            >
              <AkMessageTranslate id="takeMeToDashboard" />
            </a>
          )}

          <AkIcon name="material-symbols:north-east" className="size-4 text-primary" />
        </div>
      </div>
    </article>
  );
}
