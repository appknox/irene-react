import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { OrganizationService } from '@irene/api/services/organization';
import { getApiErrorMessage } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkConfirmBox } from '@irene/ui/ak-confirm-box';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { useOrganization } from '@/hooks/use-organization';
import { organizationKeys, samlIdpMetadataOptions } from '@/queries/organization';

import { SsoBox, SsoBoxSection } from './sso-pieces';
import { IdpMetadata, IdpMetadataUpload } from './sso-saml-idp';
import { ServiceProviderBox } from './sso-saml-sp';

/**
 * Signing in through a SAML identity provider.
 *
 * What Appknox publishes is read-only; what the provider published is uploaded
 * here as XML, read back as fields, and removed again while sign-on is off.
 *
 * @param props.isSsoEnabled - Whether sign-on is on, which holds the provider in place.
 */
export function SsoSaml({ isSsoEnabled }: Readonly<{ isSsoEnabled: boolean }>) {
  const queryClient = useQueryClient();
  const { selected } = useOrganization();

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const idpMetadata = useQuery(samlIdpMetadataOptions(selected?.id));

  const remove = useMutation({
    mutationFn: () => OrganizationService.deleteSamlIdpMetadata(Number(selected?.id)),

    onSuccess: async () => {
      akNotify.success(akMT('ssoSettings.saml.deletedIdp'));
      setIsConfirmingDelete(false);

      await queryClient.invalidateQueries({
        queryKey: organizationKeys.samlIdpMetadata(selected?.id),
      });
    },

    onError: (error) => {
      setIsConfirmingDelete(false);
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    },
  });

  return (
    <div className="flex w-full flex-col gap-5.25">
      <AkTypography variant="body2" color="textSecondary" data-test-sso-saml-description>
        {akMT('samlDesc')}
      </AkTypography>

      <ServiceProviderBox />

      <SsoBox testAttribute="sso-saml-idp">
        <SsoBoxSection>
          <AkTypography variant="subtitle1" data-test-sso-saml-idp-title>
            {akMT('identityProvider')}
          </AkTypography>
        </SsoBoxSection>

        {idpMetadata.data === undefined ? (
          <IdpMetadataUpload organizationId={selected?.id} />
        ) : (
          <IdpMetadata
            idpMetadata={idpMetadata.data}
            isSsoEnabled={isSsoEnabled}
            onDelete={() => setIsConfirmingDelete(true)}
          />
        )}
      </SsoBox>

      <AkConfirmBox
        isOpen={isConfirmingDelete}
        confirmText={akMT('delete')}
        isWorking={remove.isPending}
        onConfirm={() => remove.mutate()}
        onCancel={() => setIsConfirmingDelete(false)}
      >
        <AkTypography data-test-sso-saml-delete-question>
          {akMT('confirmBox.deleteIdpConfig')}
        </AkTypography>
      </AkConfirmBox>
    </div>
  );
}
