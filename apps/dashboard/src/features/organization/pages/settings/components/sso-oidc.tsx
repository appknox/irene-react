import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { OrganizationService } from '@irene/api/services/organization';
import { getApiErrorMessage } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkConfirmBox } from '@irene/ui/ak-confirm-box';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkFormProvider } from '@irene/ui/ak-form';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkInput } from '@irene/ui/ak-input';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { useOrganization } from '@/hooks/use-organization';
import { oidcProviderOptions, organizationKeys } from '@/queries/organization';

import {
  buildOidcProviderSchema,
  OidcProviderFormField,
  type OidcProviderFormSchema,
} from '../schemas/oidc-provider';

import { SsoBox, SsoBoxSection } from './sso-pieces';

/** Where the provider sends an account back to, which it has to be told. */
const OIDC_REDIRECT_PATH = '/sso/oidc/redirect';

/**
 * Signing in through an OpenID Connect provider.
 *
 * One provider at a time: once there is one, the form gives way to what it is,
 * and it may be removed again while sign-on is off.
 *
 * @param props.isSsoEnabled - Whether sign-on is on, which holds the provider in place.
 */
export function SsoOidc({ isSsoEnabled }: Readonly<{ isSsoEnabled: boolean }>) {
  const queryClient = useQueryClient();
  const { selected } = useOrganization();

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const provider = useQuery(oidcProviderOptions(selected?.id));

  const providerForm = useForm<OidcProviderFormSchema>({
    resolver: zodResolver(buildOidcProviderSchema()),
    defaultValues: { client_id: '', client_secret: '', discovery_url: '' },
    mode: 'onChange',
  });

  const refreshProvider = () =>
    queryClient.invalidateQueries({ queryKey: organizationKeys.oidcProvider(selected?.id) });

  const create = useMutation({
    mutationFn: (details: OidcProviderFormSchema) =>
      OrganizationService.createOidcProvider(Number(selected?.id), details),

    onSuccess: async () => {
      akNotify.success(akMT('ssoSettings.oidc.successMessage'));
      providerForm.reset();

      await refreshProvider();
    },

    onError: (error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    },
  });

  const remove = useMutation({
    mutationFn: () => OrganizationService.deleteOidcProvider(Number(selected?.id)),

    onSuccess: async () => {
      akNotify.success(akMT('removedSSOSuccessfully'));
      setIsConfirmingDelete(false);

      await refreshProvider();
    },

    onError: (error) => {
      setIsConfirmingDelete(false);
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    },
  });

  return (
    <div className="flex w-full flex-col gap-5.25">
      <AkTypography variant="body2" color="textSecondary" data-test-sso-oidc-description>
        {akMT('oidcDesc')}
      </AkTypography>

      <SsoBox testAttribute="sso-oidc-sp">
        <SsoBoxSection>
          <AkTypography variant="subtitle1" data-test-sso-oidc-sp-title>
            {akMT('serviceProvider')}
          </AkTypography>

          <AkTypography variant="body2" color="textSecondary">
            {akMT('ssoSettings.oidc.redirectUrlDesc')}
          </AkTypography>
        </SsoBoxSection>

        <SsoBoxSection isLast>
          <div className="flex gap-3.5">
            <AkTypography variant="subtitle2" className="w-4/12">
              {akMT('ssoSettings.oidc.redirectUrl')}
            </AkTypography>

            <AkTypography variant="body2" data-test-sso-oidc-redirect-url>
              {`${window.location.origin}${OIDC_REDIRECT_PATH}`}
            </AkTypography>
          </div>
        </SsoBoxSection>
      </SsoBox>

      {provider.data === undefined ? (
        <SsoBox testAttribute="sso-oidc-form">
          <AkFormProvider {...providerForm}>
            <form
              noValidate
              className="flex flex-col gap-3.5 p-3.5"
              onSubmit={(event) => {
                event.preventDefault();

                void providerForm.handleSubmit((details) => create.mutate(details))();
              }}
            >
              <AkTypography variant="subtitle1" data-test-sso-oidc-form-title>
                {akMT('ssoSettings.oidc.addOidcProvider')}
              </AkTypography>

              <OidcProviderFormField name="client_id" label={akMT('ssoSettings.oidc.clientID')}>
                <AkInput autoComplete="client-id" data-test-sso-oidc-client-id />
              </OidcProviderFormField>

              <OidcProviderFormField
                name="client_secret"
                label={akMT('ssoSettings.oidc.clientSecret')}
              >
                <AkInput
                  type="password"
                  autoComplete="one-time-code"
                  data-test-sso-oidc-client-secret
                />
              </OidcProviderFormField>

              <OidcProviderFormField
                name="discovery_url"
                label={akMT('ssoSettings.oidc.discoveryURL')}
              >
                <AkInput data-test-sso-oidc-discovery-url />
              </OidcProviderFormField>

              <div className="flex items-center gap-3.5">
                <AkButton
                  type="submit"
                  loading={create.isPending}
                  disabled={create.isPending}
                  data-test-sso-oidc-create
                >
                  {akMT('ssoSettings.oidc.createProvider')}
                </AkButton>

                <AkButton
                  type="button"
                  variant="outlined"
                  color="neutral"
                  onClick={() => providerForm.reset()}
                  data-test-sso-oidc-reset
                >
                  {akMT('reset')}
                </AkButton>
              </div>
            </form>
          </AkFormProvider>
        </SsoBox>
      ) : (
        <SsoBox testAttribute="sso-oidc-provider">
          <div className="flex w-full items-center justify-between gap-3.5 p-3.5">
            <AkTypography variant="subtitle1">{akMT('ssoSettings.oidc.oidcProvider')}</AkTypography>

            {/* Removable only while sign-on is off, as irene hides the control otherwise. */}
            {!isSsoEnabled && (
              <AkIconButton
                type="button"
                variant="outlined"
                aria-label={akMT('delete')}
                disabled={remove.isPending}
                onClick={() => setIsConfirmingDelete(true)}
                data-test-sso-oidc-delete
              >
                <AkIcon name="material-symbols:delete" />
              </AkIconButton>
            )}
          </div>

          <AkDivider color="dark" />

          <div className="flex gap-3.5 p-3.5">
            <AkTypography variant="subtitle2" className="w-4/12">
              {akMT('ssoSettings.oidc.discoveryURL')}
            </AkTypography>

            <AkTypography data-test-sso-oidc-provider-discovery-url>
              {provider.data.discovery_url}
            </AkTypography>
          </div>
        </SsoBox>
      )}

      <AkConfirmBox
        isOpen={isConfirmingDelete}
        confirmText={akMT('delete')}
        isWorking={remove.isPending}
        onConfirm={() => remove.mutate()}
        onCancel={() => setIsConfirmingDelete(false)}
      >
        <AkTypography data-test-sso-oidc-delete-question>
          {akMT('confirmBox.deleteOIDCConfig')}
        </AkTypography>
      </AkConfirmBox>
    </div>
  );
}
