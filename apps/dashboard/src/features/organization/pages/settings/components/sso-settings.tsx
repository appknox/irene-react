import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkTabs, AkTabsList, AkTabsTrigger } from '@irene/ui/ak-tabs';

import {
  oidcProviderOptions,
  organizationSsoOptions,
  samlIdpMetadataOptions,
} from '@/queries/organization';

import { useOrganization } from '@/hooks/use-organization';

import { SettingsPanel } from './settings-panel';
import { SsoOidc } from './sso-oidc';
import { SsoStepsDisplay, SsoWarningBanner } from './sso-pieces';
import { SsoSaml } from './sso-saml';
import { SsoToggle } from './sso-toggle';

/** Which kind of sign-on is being read: SAML, or OpenID Connect. */
type SsoTab = 'saml' | 'oidc';

/** What to do to move from one kind to the other, in irene's own words. */
const samlSteps = () => [
  akMT('ssoSettings.saml.step1'),
  akMT('ssoSettings.saml.step2'),
  akMT('ssoSettings.saml.step3'),
];

const oidcSteps = () => [
  akMT('ssoSettings.oidc.step1'),
  akMT('ssoSettings.oidc.step2'),
  akMT('ssoSettings.oidc.step3'),
];

/**
 * How members sign in: through a SAML identity provider, or through OpenID
 * Connect.
 *
 * Only one may be set up at a time. Where one is, the other tab shows what to
 * do to move across rather than a second form — which is how irene keeps two
 * from being added at once. The tab opens on whichever is set up.
 */
export function SsoSettingsPanel() {
  const { selected } = useOrganization();

  const sso = useQuery(organizationSsoOptions(selected?.id));
  const idpMetadata = useQuery(samlIdpMetadataOptions(selected?.id));
  const oidcProvider = useQuery(oidcProviderOptions(selected?.id));

  const hasSaml = idpMetadata.data !== undefined;
  const hasOidc = oidcProvider.data !== undefined;

  /* Unset until something is read, so the tab can open on whichever is set up. */
  const [chosenTab, setChosenTab] = useState<SsoTab | null>(null);

  const tab = chosenTab ?? (hasOidc ? 'oidc' : 'saml');

  /* One kind is set up and the other tab is open, which is where the steps belong. */
  const showsSteps = (hasOidc && tab === 'saml') || (hasSaml && tab === 'oidc');
  const isOidcInTheWay = hasOidc && tab === 'saml';

  const isSsoEnabled = Boolean(sso.data?.enabled);

  return (
    <SettingsPanel title={akMT('singleSignOn')} className="max-w-200" testAttribute="org-sso">
      <AkTabs
        value={tab}
        onValueChange={(value) => setChosenTab(value as SsoTab)}
        className="mb-3.5 w-full"
      >
        <AkTabsList>
          <AkTabsTrigger value="saml" data-test-org-sso-tab-saml>
            {akMT('samlAuth')}
          </AkTabsTrigger>

          <AkTabsTrigger value="oidc" data-test-org-sso-tab-oidc>
            {akMT('oidc')}
          </AkTabsTrigger>
        </AkTabsList>
      </AkTabs>

      {showsSteps ? (
        <div className="flex w-full flex-col gap-3.5">
          <SsoWarningBanner
            text={
              isOidcInTheWay ? akMT('ssoSettings.oidc.warning') : akMT('ssoSettings.saml.warning')
            }
          />

          <SsoStepsDisplay
            title={isOidcInTheWay ? akMT('ssoSettings.oidc.title') : akMT('ssoSettings.saml.title')}
            steps={isOidcInTheWay ? oidcSteps() : samlSteps()}
          />
        </div>
      ) : (
        <div className="flex w-full flex-col gap-5.25">
          {tab === 'saml' ? (
            <SsoSaml isSsoEnabled={isSsoEnabled} />
          ) : (
            <SsoOidc isSsoEnabled={isSsoEnabled} />
          )}

          {/* Only once a provider is set up: there is nothing to switch on before that. */}
          {((tab === 'saml' && hasSaml) || (tab === 'oidc' && hasOidc)) && (
            <SsoToggle sso={sso.data} />
          )}
        </div>
      )}
    </SettingsPanel>
  );
}
