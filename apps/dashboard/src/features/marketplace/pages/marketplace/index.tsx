import {
  getMarketplaceIntegrations,
  getMarketplacePlugins,
  type MarketplaceItem,
} from '@/features/marketplace/items';

import { akMT } from '@irene/translations/intl';
import { AkTypography } from '@irene/ui/ak-typography';
import { MarketplaceCard } from '@/features/marketplace/components/marketplace-card';

interface MarketplaceSectionProps {
  id: string;
  title: string;
  description: string;
  items: MarketplaceItem[];
}

/** One group of tools: what they are for, and a card for each. */
function _MarketplaceSection({ id, title, description, items }: Readonly<MarketplaceSectionProps>) {
  return (
    <section className="flex flex-col gap-3.5" aria-labelledby={`marketplace-${id}`}>
      <div className="flex flex-col gap-1">
        <AkTypography tag="h2" variant="h5" id={`marketplace-${id}`}>
          {title}
        </AkTypography>

        <AkTypography color="textSecondary">{description}</AkTypography>
      </div>

      <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <li key={item.id}>
            <MarketplaceCard item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The marketplace: the CI/CD plugins that scan each build, and the tools that
 * hear about what a scan found.
 */
export function MarketplacePage() {
  return (
    <div className="flex flex-col gap-7 p-5.25">
      <AkTypography tag="h1" variant="h4" className="text-xl">
        {akMT('marketplace')}
      </AkTypography>

      <_MarketplaceSection
        id="plugins"
        title={akMT('plugins')}
        description={akMT('marketplacePluginDesc')}
        items={getMarketplacePlugins()}
      />

      <_MarketplaceSection
        id="integrations"
        title={akMT('integration')}
        description={akMT('marketplaceIntegrationDesc')}
        items={getMarketplaceIntegrations()}
      />
    </div>
  );
}
