import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { OrganizationService } from '@irene/api/services/organization';
import { getApiErrorMessage } from '@irene/api/utils/errors';
import { getSignedInUserId } from '@irene/api/utils/session';
import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkLabel } from '@irene/ui/ak-label';
import { AkLink } from '@irene/ui/ak-link';
import { AkToggle } from '@irene/ui/ak-toggle';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';
import { akNotify } from '@irene/ui/notify';

import { useOrganization } from '@/hooks/use-organization';
import { organizationKeys } from '@/queries/organization';
import { userOptions } from '@/queries/user';

import { SettingsPanel } from './settings-panel';

/** Where an account turns on its own second factor, which this setting requires first. */
const ACCOUNT_SECURITY_ADDRESS = '/dashboard/settings/security';

/**
 * Whether every account in the organization must carry a second factor.
 *
 * The switch is held until the asking account has one of its own, as irene
 * holds it: an owner cannot mandate what they have not done themselves.
 */
export function OrganizationMfaPanel() {
  const queryClient = useQueryClient();
  const { selected } = useOrganization();

  const signedInUserId = getSignedInUserId();
  const user = useQuery(userOptions(signedInUserId ?? ''));

  const hasOwnMfa =
    user.data?.mfa_method === ENUMS.MFA_METHOD.TOTP ||
    user.data?.mfa_method === ENUMS.MFA_METHOD.HOTP;

  const setMandate = useMutation({
    mutationFn: (isMandatory: boolean) =>
      OrganizationService.setMandatoryMfa(Number(selected?.id), isMandatory),

    onSuccess: async () => {
      akNotify.success(akMT('changedMandatoryMFA'));

      await queryClient.invalidateQueries({ queryKey: organizationKeys.list() });
    },

    onError: (error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    },
  });

  /* Mandating it needs a second factor on this account first, so the control waits for one. */
  const isHeldBack = !hasOwnMfa || setMandate.isPending;

  return (
    <SettingsPanel
      title={akMT('multiFactorAuth')}
      subtitle={akMT('multiFactorAuthSubtitle')}
      description={akMT('enableMandatoryMFADescription')}
      className="max-w-150"
      testAttribute="org-mfa"
    >
      <div className="flex flex-col">
        {/*
          21px above and below, as irene margins the control. The switch brings its own
          6px beside the label, so the row adds no gap of its own.
        */}
        <div className="mt-3.5 mb-5.25 flex items-center">
          <AkToggle
            id="mandate-mfa"
            size="small"
            checked={Boolean(selected?.mandatory_mfa)}
            disabled={isHeldBack}
            onCheckedChange={(checked) => setMandate.mutate(checked)}
            data-test-org-mfa-toggle
          />

          {/* Greyed with the switch, as irene greys the label of a control it holds. */}
          <AkLabel
            htmlFor="mandate-mfa"
            className={cn(
              'text-base leading-normal font-normal',
              isHeldBack && 'text-foreground-disabled'
            )}
            data-test-org-mfa-label
          >
            {akMT('enableMandatoryMFATitle')}
          </AkLabel>
        </div>

        <div
          className="
            mb-3.5 flex items-center rounded-xs border border-danger bg-danger-subtle p-3.5
          "
        >
          <AkIcon name="material-symbols:warning" className="size-5.25 text-danger" aria-hidden />

          <AkTypography className="ml-3.5" data-test-org-mfa-warning>
            {akMT('enableMandatoryMFAWarning')}
          </AkTypography>
        </div>

        {/* Only while the asking account has no second factor of its own, which it needs first. */}
        {!hasOwnMfa && (
          <div
            className="
              mb-5.25 flex items-center rounded-xs border border-warning-strong bg-warning-surface
              p-3.5 text-warning-strong
            "
          >
            <AkIcon
              name="material-symbols:security"
              className="size-5.25 text-inherit"
              aria-hidden
            />

            <div className="ml-5.25 flex flex-col">
              <AkTypography color="inherit" className="mb-1.75" data-test-org-mfa-requirement>
                {akMT('enableMandatoryMFARequirement')}
              </AkTypography>

              <AkLink
                href={ACCOUNT_SECURITY_ADDRESS}
                className="text-inherit"
                data-test-org-mfa-account-link
              >
                {`${akMT('accountSettings')} > ${akMT('security')} > ${akMT('multiFactorAuth')}`}
              </AkLink>
            </div>
          </div>
        )}
      </div>
    </SettingsPanel>
  );
}
