import { Fragment } from 'react';
import { useStore } from 'zustand';

import { configurationStore } from '@irene/api/stores/configuration';
import { isPluginEnabled } from '@irene/config';
import { PRODUCT_VERSIONS } from '@irene/config/product';
import { akMT } from '@irene/translations/intl';
import { AkDivider } from '@irene/ui/ak-divider';
import { cn } from '@irene/ui/cn';

import { AppLogo } from '@/components/app-logo';
import { useOrganization } from '@/hooks/use-organization';
import { useWhitelabel } from '@/hooks/use-whitelabel';
import { closeFreshchat, toggleFreshchat } from '@/scripts/freshchat';
import { PENDO_CONTAINER_ID, showProductGuides } from '@/scripts/pendo';

import { LowerNavItem } from './lower-nav-item';
import { SideNavItem, type SideNavItemDefinition } from './nav-item';
import { ProductSwitcher } from './product-switcher';

interface SideNavProps {
  items: SideNavItemDefinition[];
  isCollapsed: boolean;
  onSidebarToggle: () => void;
}

/**
 * The navigation every product's layout renders.
 *
 * The items belong to the product: each layout builds its own list and passes
 * it in. Everything else is the same wherever it renders — the logo, the
 * product switcher, and the chat, release and width rows below the list.
 *
 * Collapsed, it shows icons alone and each carries a tooltip; expanded, the
 * labels are on screen and the tooltips are turned off rather than repeating
 * them. An item stays lit for the pages beneath it, so opening a project keeps
 * Projects marked.
 *
 * @param props.items - The product's navigation items, in the order they are shown.
 * @param props.isCollapsed - Whether only the icons are shown.
 * @param props.onSidebarToggle - Switches between the two widths.
 */
export function SideNav({ items, isCollapsed, onSidebarToggle }: Readonly<SideNavProps>) {
  const organization = useOrganization();
  const { favicon, logo } = useWhitelabel();

  /* Chat is offered only where the install carries a key for it. */
  const hasChatSupport = useStore(configurationStore, (config) => Boolean(config.freshchatKey()));

  const hasProductGuides = isPluginEnabled('IRENE_ENABLE_PENDO');
  const organizationFeatures = organization.features();

  /* Nothing to switch to means no switcher: the account would open its own dashboard again. */
  const hasOtherProducts =
    organizationFeatures.storeknox ||
    organization.aiFeatures().reporting ||
    organization.hasSecurityPermission() ||
    organization.showsOffensiveSecurity();

  const toggleLabel = isCollapsed ? akMT('expand') : akMT('collapse');

  return (
    <aside
      className={cn(
        'flex h-screen flex-col overflow-hidden border-r',
        `
          border-divider-strong bg-background py-2 shadow-18 transition-[width] duration-200
          ease-in-out
        `,
        isCollapsed ? 'w-14' : 'w-62.5'
      )}
      data-test-side-nav
    >
      {/* Collapsed, the mark sits 14px below the aside's top: 8px of padding and 6px here. */}
      <div
        className={cn(
          'flex shrink-0 justify-center',
          isCollapsed ? 'h-21 items-start pt-1.5' : 'h-30 items-center'
        )}
      >
        <AppLogo
          src={isCollapsed ? favicon : logo}
          className={cn(
            'block object-contain',
            isCollapsed ? 'max-h-8.75 max-w-8.75' : 'max-h-full max-w-35'
          )}
        />
      </div>

      {/* Both rules belong to the switcher: with nothing between them they read as one line. */}
      {hasOtherProducts && (
        <Fragment>
          <AkDivider />

          <ProductSwitcher
            isCollapsed={isCollapsed}
            className={cn(
              'flex w-full items-center gap-2 px-4 py-2.5 hover:bg-hover-light',
              isCollapsed && 'justify-center'
            )}
          />

          <AkDivider />
        </Fragment>
      )}

      <nav className="flex-1 overflow-y-auto pt-9" aria-label={akMT('allProjects')}>
        <ul className="flex flex-col">
          {items.map((item) => (
            <SideNavItem
              key={item.id}
              item={item}
              isCollapsed={isCollapsed}
              onClick={closeFreshchat}
            />
          ))}
        </ul>
      </nav>

      <ul className="flex flex-col">
        {hasChatSupport && (
          <LowerNavItem
            label={akMT('chatSupport')}
            icon="material-symbols:chat-bubble"
            isCollapsed={isCollapsed}
            onClick={toggleFreshchat}
            iconClassName="text-primary"
          />
        )}

        <LowerNavItem
          id={hasProductGuides ? PENDO_CONTAINER_ID : undefined}
          onClick={hasProductGuides ? showProductGuides : undefined}
          label={`${akMT('version')} - ${PRODUCT_VERSIONS.appknox}`}
          icon="material-symbols:info"
          isCollapsed={isCollapsed}
        />

        <li>
          <AkDivider className="my-1.25" />
        </li>

        <LowerNavItem
          label={toggleLabel}
          icon="material-symbols:keyboard-tab"
          isCollapsed={isCollapsed}
          onClick={onSidebarToggle}
          iconClassName={cn(!isCollapsed && 'rotate-180')}
        />
      </ul>
    </aside>
  );
}
