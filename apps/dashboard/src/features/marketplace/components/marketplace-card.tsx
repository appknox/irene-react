import { Link } from '@tanstack/react-router';
import { useState } from 'react';

import {
  AkDrawer,
  AkDrawerBody,
  AkDrawerContent,
  AkDrawerHeader,
  AkDrawerTrigger,
} from '@irene/ui/ak-drawer';

import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';
import type { IconName } from '@irene/ui/icons/sets';

import { useOrganization } from '@/hooks/use-organization';
import type { MarketplaceItem } from '@/features/marketplace/items';

import { SetupGuide } from './setup-guides';

/**
 * The face of a card: the tool's logo, its name, and what opening it does. It
 * draws the card's surface; the control around it is the whole card, so it
 * reacts as a `group` to that control being hovered or focused.
 */
function _CardFace({ item, icon }: Readonly<{ item: MarketplaceItem; icon: IconName }>) {
  return (
    <div
      className="
        flex h-full flex-col gap-3.5 rounded-sm border border-border bg-background p-5.25 text-left
        shadow-7 transition-shadow
        group-hover:shadow-17
        group-focus-visible:shadow-17
      "
    >
      <div className="flex items-start justify-between gap-3.5">
        <img src={item.logo} alt="" className="size-11 object-contain" />

        <AkIcon
          name={icon}
          className="size-4.5 text-foreground-muted transition-colors group-hover:text-primary"
        />
      </div>

      <div className="flex flex-col gap-1">
        <AkTypography tag="h3" variant="h6" data-test-marketplace-card-title>
          {item.title}
        </AkTypography>

        <AkTypography variant="body2" color="textSecondary">
          {item.description}
        </AkTypography>
      </div>
    </div>
  );
}

/**
 * A tool set up by hand, opening its steps in a drawer beside the page: they
 * run long, with commands to copy and screenshots to follow.
 *
 * @param props.item - The tool.
 */
function GuideCard({ item }: Readonly<{ item: Extract<MarketplaceItem, { kind: 'guide' }> }>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AkDrawer open={isOpen} onOpenChange={setIsOpen}>
      <AkDrawerTrigger asChild>
        <button
          type="button"
          className="
            group block h-full w-full rounded-sm outline-none
            focus-visible:ring-3 focus-visible:ring-ring/50
          "
          data-test-marketplace-card={item.id}
        >
          <_CardFace item={item} icon="material-symbols:chevron-right" />
        </button>
      </AkDrawerTrigger>

      <AkDrawerContent aria-describedby={undefined} className="w-180" data-test-setup-guide>
        <AkDrawerHeader title={item.heading} closeLabel={akMT('close')} />

        <AkDrawerBody className="flex flex-col gap-5.25 px-5.25 py-5.25">
          <div className="flex items-center gap-3.5">
            <img src={item.logo} alt="" className="size-11 object-contain" />

            <AkTypography tag="h3" variant="h5">
              {item.title}
            </AkTypography>
          </div>

          <SetupGuide guide={item.guide} />
        </AkDrawerBody>
      </AkDrawerContent>
    </AkDrawer>
  );
}

/**
 * A tool connected from the organization's integration settings. Only an
 * admin may connect one, so anyone else is told so, as irene tells them,
 * rather than sent to settings they cannot change.
 *
 * @param props.item - The tool.
 */
function IntegrationCard({ item }: Readonly<{ item: MarketplaceItem }>) {
  const isAdmin = useOrganization().me?.is_admin;

  if (isAdmin) {
    return (
      <Link
        to="/dashboard/organization/settings/integrations"
        className="
          group block h-full w-full rounded-sm outline-none
          focus-visible:ring-3 focus-visible:ring-ring/50
        "
        data-test-marketplace-card={item.id}
      >
        <_CardFace item={item} icon="material-symbols:arrow-forward" />
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="
        group block h-full w-full rounded-sm outline-none
        focus-visible:ring-3 focus-visible:ring-ring/50
      "
      onClick={() => akNotify.error(akMT('integrationsPermissionDenied'))}
      data-test-marketplace-card={item.id}
    >
      <_CardFace item={item} icon="material-symbols:lock" />
    </button>
  );
}

/**
 * One tool on the marketplace, opening whatever sets it up: the maker's page
 * in a new tab, the steps in a drawer, or the organization's integrations.
 *
 * @param props.item - The tool.
 */
export function MarketplaceCard({ item }: Readonly<{ item: MarketplaceItem }>) {
  switch (item.kind) {
    case 'link':
      return (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="
            group block h-full w-full rounded-sm outline-none
            focus-visible:ring-3 focus-visible:ring-ring/50
          "
          data-test-marketplace-card={item.id}
        >
          <_CardFace item={item} icon="material-symbols:open-in-new" />
        </a>
      );
    case 'guide':
      return <GuideCard item={item} />;
    case 'integration':
      return <IntegrationCard item={item} />;
  }
}
