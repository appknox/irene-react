import { useMutation, useQueryClient } from '@tanstack/react-query';

import { OrganizationService, type ApiOrganizationSso } from '@irene/api/services/organization';
import { getApiErrorMessage } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkCheckbox } from '@irene/ui/ak-checkbox';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkLabel } from '@irene/ui/ak-label';
import { AkToggle } from '@irene/ui/ak-toggle';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { useOrganization } from '@/hooks/use-organization';
import { organizationKeys } from '@/queries/organization';

import { SsoBox, SsoBoxSection } from './sso-pieces';

/**
 * Whether members may sign in through the provider, and whether they must.
 *
 * Enforcing it is only offered once sign-on is on, as irene reveals it: there
 * is nothing to enforce otherwise.
 *
 * @param props.sso - The setting as it stands, absent until it has been read.
 */
export function SsoToggle({ sso }: Readonly<{ sso: ApiOrganizationSso | undefined }>) {
  const queryClient = useQueryClient();
  const { selected } = useOrganization();

  const save = useMutation({
    mutationFn: (next: Pick<ApiOrganizationSso, 'enabled' | 'enforced'>) =>
      OrganizationService.setOrganizationSso(Number(selected?.id), next),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: organizationKeys.sso(selected?.id) });
    },

    onError: (error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    },
  });

  const setEnabled = (enabled: boolean) => {
    if (sso === undefined) {
      akNotify.error(akMT('ssoNotFound'));

      return;
    }

    save.mutate(
      { enabled, enforced: sso.enforced },
      {
        onSuccess: () => {
          akNotify.success(
            `${akMT('ssoAuthentication')} ${enabled ? akMT('enabled') : akMT('disabled')}`
          );
        },
      }
    );
  };

  const setEnforced = (enforced: boolean) => {
    if (sso === undefined) {
      akNotify.error(akMT('ssoNotFound'));

      return;
    }

    save.mutate(
      { enabled: sso.enabled, enforced },
      {
        onSuccess: () => {
          akNotify.success(`${akMT('ssoEnforceTurned')} ${enforced ? akMT('on') : akMT('off')}`);
        },
      }
    );
  };

  return (
    <SsoBox testAttribute="sso-toggle">
      <SsoBoxSection>
        <AkTypography variant="subtitle1" data-test-sso-toggle-title>
          {akMT('ssoAuthentication')}
        </AkTypography>
      </SsoBoxSection>

      <SsoBoxSection isLast={!sso?.enabled}>
        <div className="flex items-center gap-1.75">
          <AkToggle
            id="sso-enabled"
            size="small"
            checked={Boolean(sso?.enabled)}
            disabled={save.isPending}
            onCheckedChange={setEnabled}
            data-test-sso-toggle-switch
          />

          <AkLabel htmlFor="sso-enabled" className="text-base font-medium">
            {`${akMT('enable')} ${akMT('ssoAuthentication')}`}
          </AkLabel>

          <AkTypography tag="span" variant="body2" color="textSecondary">
            {`(${akMT('ssoEnableDesc')})`}
          </AkTypography>
        </div>
      </SsoBoxSection>

      {/* Only once sign-on is on, which is the only time there is anything to enforce. */}
      {sso?.enabled === true && (
        <SsoBoxSection isLast>
          <div className="flex items-center gap-1.75">
            <AkIcon
              name="material-symbols:subdirectory-arrow-right"
              className="size-4.75"
              aria-hidden
            />

            <AkCheckbox
              id="sso-enforced"
              checked={sso.enforced}
              disabled={save.isPending}
              onCheckedChange={(checked) => setEnforced(checked === true)}
              data-test-sso-toggle-enforce
            />

            <AkLabel htmlFor="sso-enforced" className="text-base font-medium">
              {akMT('enforceSSO')}
            </AkLabel>

            <AkTypography tag="span" variant="body2" color="textSecondary">
              {`(${akMT('ssoEnforceDesc')})`}
            </AkTypography>
          </div>
        </SsoBoxSection>
      )}
    </SsoBox>
  );
}
