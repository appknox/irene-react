import { Link, Outlet, useMatchRoute, useRouterState } from '@tanstack/react-router';

import { organizationStore } from '@irene/api/stores/organization';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTabs, AkTabsContent, AkTabsList, AkTabsTrigger } from '@irene/ui/ak-tabs';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { useOrganization } from '@/hooks/use-organization';
import { useServerConfiguration } from '@/hooks/use-server-configuration';

import { ORGANIZATION_SETTINGS_TABS } from './settings-tabs';
import { OrganizationNameHeader } from './organization-name-header';

/** One tab of the organization's settings. */
interface SettingsTab {
  label: string;
  to: string;
}

/**
 * The frame every organization settings screen sits in.
 *
 * It holds the trail back to the organization, its name with the way to change
 * it, and the row of tabs. The trail and the tabs stay in place while the tab
 * under them scrolls, as irene pins both.
 *
 * Which tabs are offered is the organization's own business: the service
 * account only where the public API is on and the account administers or owns
 * the organization, and the AI features only where the organization has one
 * and is not an enterprise deployment, as irene decides them.
 */
export function OrganizationSettingsWrapper() {
  const { selected, me } = useOrganization();
  const { isEnterprise } = useServerConfiguration();
  const matchRoute = useMatchRoute();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const isOwner = Boolean(me?.is_owner);
  const administersOrOwns = isOwner || Boolean(me?.is_admin);

  const hasPublicApi = organizationStore.getState().features().public_apis;

  /* Offered where the organization has any of them, and never to an enterprise deployment. */
  const aiFeatures = organizationStore.getState().aiFeatures();
  const hasAiFeature = Object.values(aiFeatures).some(Boolean);
  const showsAiFeatures = hasAiFeature && isOwner && !isEnterprise;

  const tabs: SettingsTab[] = [
    { label: akMT('organizationSettings'), to: ORGANIZATION_SETTINGS_TABS.settings },
    { label: akMT('integrations'), to: ORGANIZATION_SETTINGS_TABS.integrations },

    ...(hasPublicApi && administersOrOwns
      ? [{ label: akMT('serviceAccount'), to: ORGANIZATION_SETTINGS_TABS.serviceAccount }]
      : []),

    ...(showsAiFeatures
      ? [{ label: akMT('aiPoweredFeatures'), to: ORGANIZATION_SETTINGS_TABS.aiPoweredFeatures }]
      : []),
  ];

  /* The settings tab owns the base path, so it matches exactly where the others do not. */
  const activeTab =
    tabs.find((tab) => matchRoute({ to: tab.to, fuzzy: tab.to !== tabs[0]?.to }))?.to ?? pathname;

  return (
    <div
      className="flex min-h-[calc(100vh-56px)] w-full flex-col bg-background-subtle"
      data-test-organization-settings
    >
      {/* Pinned, as irene pins both: the trail and the tabs stay while the tab scrolls. */}
      <div
        className="sticky top-0 z-10 bg-background-subtle pt-3.5 pb-5.25"
        data-test-organization-settings-breadcrumbs
      >
        <Breadcrumbs />
      </div>

      {/* irene offers the rename here, to an owner of an organization that already has a name. */}
      <OrganizationNameHeader
        action={({ openNameModal }) =>
          isOwner &&
          selected?.name !== '' && (
            <AkButton
              variant="outlined"
              onClick={openNameModal}
              data-test-organization-settings-rename
            >
              <AkIcon name="material-symbols:edit" />

              {akMT('editName')}
            </AkButton>
          )
        }
      />

      <div className="mt-5.25 flex min-h-0 flex-1 flex-col">
        <AkTabs value={activeTab} activationMode="manual" className="gap-0">
          <AkTabsList variant="shadow" className="sticky top-14 z-10 bg-background-subtle">
            {tabs.map((tab) => (
              <AkTabsTrigger key={tab.to} value={tab.to} asChild>
                <Link to={tab.to}>{tab.label}</Link>
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
