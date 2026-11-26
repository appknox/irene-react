import { Fragment } from 'react';

import { AkDivider } from '@irene/ui/ak-divider';

import { useOrganization } from '@/hooks/use-organization';

import { DeviceRegistrationPanel } from './components/device-registration';
import { EditAnalysisPanel } from './components/edit-analysis';
import { EmailDomainsPanel } from './components/email-domains';
import { FileCleanupPanel } from './components/file-cleanup';
import { OrganizationArchivePanel } from './components/organization-archive';
import { OrganizationMfaPanel } from './components/organization-mfa';
import { RegulatoryPreferencesPanel } from './components/regulatory-preferences';
import { SettingsPageSkeleton } from './components/settings-page-skeleton';
import { SigningCertificatePanel } from './components/signing-certificate';
import { SsoSettingsPanel } from './components/sso-settings';
import { useSettingsReady } from './use-settings-ready';

/**
 * The first tab of the organization's settings.
 *
 * Which sections are drawn depends on the account and on what the organization
 * has, exactly as irene's own template decides it: the first three are an
 * owner's alone, single sign-on appears only where the organization has that
 * feature, the email domains are read by everyone but changed only by an owner,
 * and the two device sections need the organization's own devices to be allowed
 * — the certificate one also needs registration to be on.
 *
 * Every section but the last is followed by a rule, which is how irene sets
 * them apart, and the whole tab sits on white with irene's own padding —
 * 21px above, 28px either side and 70px below.
 */
export function OrganizationSettingsPage() {
  const { me, selected, features } = useOrganization();
  const isReady = useSettingsReady();

  const isOwner = Boolean(me?.is_owner);
  const hasSso = Boolean(features().sso);
  const hasCyod = Boolean(features().cyod);

  /* The certificate is only of use once devices may be registered against it. */
  const allowsDeviceRegistration = hasCyod && Boolean(selected?.cyod_registration_enabled);

  const sections = [
    { key: 'edit-analysis', shows: isOwner, panel: <EditAnalysisPanel /> },
    { key: 'regulatory-preferences', shows: isOwner, panel: <RegulatoryPreferencesPanel /> },
    { key: 'mfa', shows: isOwner, panel: <OrganizationMfaPanel /> },
    { key: 'sso', shows: hasSso, panel: <SsoSettingsPanel /> },

    {
      key: 'email-domains',
      shows: true,
      panel: <EmailDomainsPanel isEditable={isOwner} />,
    },

    {
      key: 'device-registration',
      shows: isOwner && hasCyod,
      panel: <DeviceRegistrationPanel />,
    },

    {
      key: 'signing-certificate',
      shows: isOwner && allowsDeviceRegistration,
      panel: <SigningCertificatePanel />,
    },

    { key: 'archive', shows: true, panel: <OrganizationArchivePanel /> },
    { key: 'file-cleanup', shows: true, panel: <FileCleanupPanel /> },
  ];

  const drawn = sections.filter((section) => section.shows);

  /*
    One loader for the whole screen: it stands in until every answer its sections need is
    in, so what the reader sees goes from the shape of the page straight to the page, with
    no section filling itself in afterwards.
  */
  if (!isReady) {
    return <SettingsPageSkeleton />;
  }

  return (
    <div className="flex w-full flex-col bg-background px-7 pt-5.25 pb-17.5" data-test-org-settings>
      {drawn.map((section, index) => (
        <Fragment key={section.key}>
          {section.panel}

          {index < drawn.length - 1 && <AkDivider color="dark" className="my-5.25" />}
        </Fragment>
      ))}
    </div>
  );
}
