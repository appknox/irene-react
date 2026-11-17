import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkTypography } from '@irene/ui/ak-typography';
import TurnOnSettingsSvg from '@irene/ui/svgs/turn-on-settings.svg?react';

/* Organization settings are still irene's, and a full page load at this path is handed to it. */
const AI_SETTINGS_PATH = '/dashboard/organization/settings/ai-powered-features';

/**
 * What stands in for Generate while the organization has AI reporting switched
 * off in its own settings. Only an owner can switch it on, so only an owner is
 * offered the way there, in a new tab as irene opens it.
 *
 * @param props.isOwner - Whether the account owns the organization.
 */
export function TurnOnSettings({ isOwner }: Readonly<{ isOwner: boolean }>) {
  return (
    <section className="flex flex-col items-center gap-3 px-6 py-16 text-center" data-test-turn-on-settings>
      <TurnOnSettingsSvg className="h-40 w-auto" aria-hidden />

      <AkTypography variant="h5" tag="h1" className="max-w-130">
        {akMT('reportModule.turnOnSettingsHeaderText')}
      </AkTypography>

      <AkTypography color="textSecondary" className="max-w-130">
        {akMT('reportModule.turnOnSettingsBodyText')}
      </AkTypography>

      {isOwner && (
        <AkButton asChild>
          <a href={AI_SETTINGS_PATH} target="_blank" rel="noreferrer">
            {akMT('reportModule.turnOnSettingsButtonLabel')}
          </a>
        </AkButton>
      )}
    </section>
  );
}
