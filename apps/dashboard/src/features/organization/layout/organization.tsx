import { Link, Outlet, useMatchRoute, useRouterState } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTabs, AkTabsBadge, AkTabsContent, AkTabsList, AkTabsTrigger } from '@irene/ui/ak-tabs';
import type { IconName } from '@irene/ui/icons/sets';

import { useOrganization } from '@/hooks/use-organization';

import { OrganizationNameHeader } from './organization-name-header';
import { ORGANIZATION_SETTINGS_TABS } from './settings-tabs';
import { ORGANIZATION_TABS } from './tabs';

/** One tab in the organization row. */
interface OrganizationTab {
  label: string;
  icon: IconName;
  to: string;
  badge?: number;
}

/**
 * The frame the organization screens sit in: a tab each, and the one in view
 * under them.
 *
 * Each tab is a link, so the route decides which is active and the tabs
 * activate manually: the arrow keys move between them without navigating.
 *
 * The counts beside them are the organization's own, and are shown to an
 * administrator alone, as irene shows them.
 */
export function OrganizationLayout() {
  const { selected, me } = useOrganization();
  const matchRoute = useMatchRoute();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const isAdmin = Boolean(me?.is_admin);

  /* irene keeps the users tab for administrators, who are the ones who manage them. */
  const tabs: OrganizationTab[] = [
    {
      label: akMT('namespaces'),
      icon: 'material-symbols:assignment',
      to: ORGANIZATION_TABS.namespaces,
      badge: isAdmin ? selected?.namespaces_count : undefined,
    },
    ...(isAdmin
      ? [
          {
            label: akMT('users'),
            icon: 'material-symbols:group' as const,
            to: ORGANIZATION_TABS.users,
          },
        ]
      : []),
    {
      label: akMT('teams'),
      icon: 'material-symbols:groups',
      to: ORGANIZATION_TABS.teams,
      badge: isAdmin ? selected?.teams_count : undefined,
    },
  ];

  const activeTab = tabs.find((tab) => matchRoute({ to: tab.to }))?.to ?? pathname;

  return (
    <div className="w-full" data-test-organization>
      <div className="w-full">
        {/* irene sets the header off from the tabs with 1em above and below. */}
        <div className="py-3.5">
          {/* irene puts the way through to the settings here, for an administrator. */}
          <OrganizationNameHeader
            action={() =>
              isAdmin && (
                <AkButton asChild variant="outlined" data-test-org-settings-link>
                  <a href={ORGANIZATION_SETTINGS_TABS.settings}>
                    <AkIcon name="material-symbols:settings" />

                    {akMT('organizationSettings')}
                  </a>
                </AkButton>
              )
            }
          />
        </div>

        <AkTabs value={activeTab} activationMode="manual" className="gap-0">
          <AkTabsList>
            {tabs.map((tab) => (
              <AkTabsTrigger key={tab.to} value={tab.to} asChild>
                <Link to={tab.to}>
                  <AkIcon name={tab.icon} />

                  {tab.label}

                  {tab.badge !== undefined && <AkTabsBadge>{tab.badge}</AkTabsBadge>}
                </Link>
              </AkTabsTrigger>
            ))}
          </AkTabsList>

          <AkTabsContent value={activeTab}>
            <Outlet />
          </AkTabsContent>
        </AkTabs>
      </div>
    </div>
  );
}
