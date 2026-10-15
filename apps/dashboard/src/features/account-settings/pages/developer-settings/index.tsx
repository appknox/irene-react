import { akMT } from '@irene/translations/intl';
import { AkTypography } from '@irene/ui/ak-typography';

import { CreateTokenForm } from './components/create-token-form';
import { PersonalTokenList } from './components/personal-token-list';

/**
 * The developer settings tab of account settings: the API tokens the account
 * has generated, and a form to generate another.
 */
export function DeveloperSettingsPage() {
  return (
    <section className="flex flex-col gap-5.25 p-5.25" data-test-developer-settings>
      <div className="flex flex-col gap-1.75">
        <AkTypography variant="h5">{akMT('personalAccessTokens')}</AkTypography>

        <AkTypography color="textSecondary">{akMT('personalAccessTokenDesc')}</AkTypography>
      </div>

      <CreateTokenForm />

      <PersonalTokenList />
    </section>
  );
}
