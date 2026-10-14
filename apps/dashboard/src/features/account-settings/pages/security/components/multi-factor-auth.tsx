import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Fragment, useState } from 'react';

import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';
import { AkAlert, AkAlertDescription } from '@irene/ui/ak-alert';
import { AkButton } from '@irene/ui/ak-button';
import { AkChip } from '@irene/ui/ak-chip';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkLink } from '@irene/ui/ak-link';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiMfa } from '@irene/api/services/mfa';

import { mfaMethodsOptions } from '@/features/account-settings/queries/mfa';
import { useOrganization } from '@/hooks/use-organization';
import { useSignedInUser } from '@/hooks/use-signed-in-user';

import { MfaAppEnable } from './mfa-app-enable';
import { MfaDisable } from './mfa-disable';
import { MfaEmailEnable } from './mfa-email-enable';
import { MfaSwitchToApp } from './mfa-switch-to-app';
import { MfaSwitchToEmail } from './mfa-switch-to-email';

/** The modal open over the list, if any: one per flow irene offers. */
type MfaModalName = 'disable' | 'email-enable' | 'app-enable' | 'switch-to-app' | 'switch-to-email';

/** The authenticator apps irene suggests, with the platforms each runs on. */
const AUTHENTICATOR_APPS = [
  {
    platforms: () => akMT('mfaAppAndroidIosBlackberry'),
    app: 'Google Authenticator',
    infoUrl: 'https://support.google.com/accounts/answer/1066447?hl=en',
  },
  {
    platforms: () => akMT('mfaAppAndroidIos'),
    app: 'Duo Mobile',
    infoUrl: 'https://guide.duo.com/third-party-accounts',
  },
  {
    platforms: () => akMT('mfaAppWindowsPhone'),
    app: 'Authenticator',
    infoUrl: 'https://www.microsoft.com/en-us/store/p/authenticator/9wzdncrfj3rj',
  },
];

/**
 * Lists both second factors, marks the active one, and opens the flow that
 * enables, switches or disables one.
 *
 * Enabling a method while the other is active switches to it instead. The
 * disable control is offered only where the organization lets the account turn
 * MFA off; otherwise a notice says why, and points an owner at the setting.
 */
export function MultiFactorAuth() {
  const user = useSignedInUser();
  const { me } = useOrganization();
  const { data: methods = [] } = useQuery(mfaMethodsOptions());
  const [openModal, setOpenModal] = useState<MfaModalName | null>(null);

  const canDisableMfa = Boolean(user.can_disable_mfa);
  const isMfaEnabled = methods.some((mfa) => mfa.enabled);

  const isEnabled = (method: ApiMfa['method']) =>
    methods.some((mfa) => mfa.method === method && mfa.enabled);

  const closeModal = () => setOpenModal(null);

  const enable = (method: ApiMfa['method']) => {
    if (method === ENUMS.MFA_METHOD.HOTP) {
      setOpenModal(isMfaEnabled ? 'switch-to-email' : 'email-enable');
    } else {
      setOpenModal(isMfaEnabled ? 'switch-to-app' : 'app-enable');
    }
  };

  return (
    <section className="flex w-8/12 flex-col gap-5.25" data-test-multi-factor-auth>
      <div className="flex flex-col gap-1.75">
        <AkTypography variant="h5" data-test-mfa-title>
          {akMT('multiFactorAuth')}
        </AkTypography>

        <AkTypography color="textSecondary">{akMT('mfaDescription')}</AkTypography>
      </div>

      {!canDisableMfa && (
        <AkAlert variant="warning" data-test-mfa-cannot-disable>
          <AkIcon name="material-symbols:security" />

          <AkAlertDescription className="flex flex-wrap items-center gap-x-1">
            {akMT('disableMFADenied')}

            {me?.is_owner && (
              <>
                <span>{akMT('disableThisIn')}</span>

                <AkLink asChild color="inherit" className="font-semibold">
                  <Link to="/dashboard/organization/settings">{akMT('organizationSettings')}</Link>
                </AkLink>
              </>
            )}
          </AkAlertDescription>
        </AkAlert>
      )}

      <div className="flex flex-col gap-2.5">
        <AkTypography color="textSecondary">{akMT('mfaSelect')}</AkTypography>

        {methods.length > 0 && (
          <div
            className="flex w-full flex-col rounded-sm border border-border"
            data-test-mfa-options
          >
            {methods.map((mfa, index) => (
              <Fragment key={mfa.method}>
                {index > 0 && <AkDivider color="dark" />}

                <MfaMethodRow
                  mfa={mfa}
                  canDisableMfa={canDisableMfa}
                  onEnable={() => enable(mfa.method)}
                  onDisable={() => setOpenModal('disable')}
                />
              </Fragment>
            ))}
          </div>
        )}
      </div>

      {openModal === 'disable' && (
        <MfaDisable
          isEmailMfaEnabled={isEnabled(ENUMS.MFA_METHOD.HOTP)}
          isAppMfaEnabled={isEnabled(ENUMS.MFA_METHOD.TOTP)}
          canDisableMfa={canDisableMfa}
          onClose={closeModal}
        />
      )}

      {openModal === 'email-enable' && <MfaEmailEnable email={user.email} onClose={closeModal} />}

      {openModal === 'app-enable' && <MfaAppEnable email={user.email} onClose={closeModal} />}

      {openModal === 'switch-to-app' && <MfaSwitchToApp email={user.email} onClose={closeModal} />}

      {openModal === 'switch-to-email' && (
        <MfaSwitchToEmail email={user.email} onClose={closeModal} />
      )}
    </section>
  );
}

interface MfaMethodRowProps {
  mfa: ApiMfa;
  canDisableMfa: boolean;
  onEnable: () => void;
  onDisable: () => void;
}

/**
 * One method: what it is, how it works, and the control that changes it.
 *
 * @param props.mfa - The method, and whether it is active.
 * @param props.canDisableMfa - Whether the active method may be turned off.
 * @param props.onEnable - Called to enable the method, or switch to it.
 * @param props.onDisable - Called to turn the active method off.
 */
function MfaMethodRow({ mfa, canDisableMfa, onEnable, onDisable }: Readonly<MfaMethodRowProps>) {
  const isApp = mfa.method === ENUMS.MFA_METHOD.TOTP;
  const name = isApp ? akMT('mfaMethodApp') : akMT('email');

  return (
    <div className="flex w-full items-center gap-4.5 p-4.25" data-test-mfa-method={mfa.method}>
      <div className="flex w-full flex-col">
        <div className="flex items-center gap-2.5">
          <AkTypography fontWeight="medium" data-test-mfa-method-name>
            {name}
          </AkTypography>

          {mfa.enabled && (
            <AkChip
              label={akMT('enabled')}
              variant="semi-filled"
              color="success"
              size="small"
              icon={<AkIcon name="material-symbols:check" />}
              data-test-mfa-method-enabled
            />
          )}
        </div>

        <AkTypography variant="body2" color="textSecondary" className="mt-1">
          {isApp ? akMT('mfaAppDesc') : akMT('mfaEmailDesc')}
        </AkTypography>

        {isApp && (
          <div className="mt-2.5 flex flex-col gap-0.5">
            {AUTHENTICATOR_APPS.map(({ platforms, app, infoUrl }) => (
              <div key={app} className="flex items-center gap-1">
                <AkTypography variant="body2" color="textSecondary" className="text-sm">
                  {platforms()}
                </AkTypography>

                <AkLink
                  href={infoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  className="text-sm"
                >
                  {app}
                </AkLink>
              </div>
            ))}
          </div>
        )}
      </div>

      {mfa.enabled && canDisableMfa && (
        <AkButton
          variant="outlined"
          color="neutral"
          onClick={onDisable}
          data-test-mfa-disable-button
        >
          {akMT('disable')}
        </AkButton>
      )}

      {!mfa.enabled && (
        <AkButton onClick={onEnable} data-test-mfa-enable-button>
          {akMT('enable')}
        </AkButton>
      )}
    </div>
  );
}
