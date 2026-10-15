import { AkDivider } from '@irene/ui/ak-divider';

import { MultiFactorAuth } from './components/multi-factor-auth';
import { PasswordChange } from './components/password-change';

/**
 * The security tab of account settings: the password, then the second factor.
 */
export function SecuritySettingsPage() {
  return (
    <div className="flex flex-col gap-7 p-5.25" data-test-security-settings>
      <PasswordChange />

      <AkDivider color="dark" />

      <MultiFactorAuth />
    </div>
  );
}
