import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState, type ChangeEvent, type DragEvent } from 'react';

import { OrganizationService, type ApiSamlIdpMetadata } from '@irene/api/services/organization';
import { getApiErrorMessage } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkSpinner } from '@irene/ui/ak-spinner';
import { AkTextarea } from '@irene/ui/ak-textarea';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { organizationKeys } from '@/queries/organization';

import { SsoField, SsoSectionHeading } from './sso-pieces';

/* What a date in the identity provider's certificate reads as. */
const CERTIFICATE_DATE_FORMAT = 'DD MMM YYYY';

interface IdpMetadataProps {
  idpMetadata: ApiSamlIdpMetadata;

  /** Whether sign-on is on, which is when the provider may not be removed. */
  isSsoEnabled: boolean;
  onDelete: () => void;
}

/** What Appknox was told about the identity provider, once it has been told. */
export function IdpMetadata({ idpMetadata, isSsoEnabled, onDelete }: Readonly<IdpMetadataProps>) {
  const writeDate = (value: string) =>
    value === '' ? '' : dayjs(value).format(CERTIFICATE_DATE_FORMAT);

  return (
    <div className="flex w-full flex-col">
      <div className="flex w-full items-center justify-between gap-3.5 p-3.5">
        <SsoSectionHeading icon="material-symbols:integration-instructions">
          {akMT('idpMetadata')}
        </SsoSectionHeading>

        {/* Removable only while sign-on is off, as irene hides the control otherwise. */}
        {!isSsoEnabled && (
          <AkTooltip arrow side="top" title={akMT('idpMetadataDelete')}>
            <AkIconButton
              type="button"
              variant="outlined"
              aria-label={akMT('idpMetadataDelete')}
              onClick={onDelete}
              data-test-sso-saml-idp-delete
            >
              <AkIcon name="material-symbols:delete" />
            </AkIconButton>
          </AkTooltip>
        )}
      </div>

      <AkDivider color="dark" />

      <div className="flex flex-col gap-3.5 p-3.5">
        <SsoField label={akMT('entityID')} value={idpMetadata.entity_id} />

        <SsoField label={akMT('ssoServiceURL')} value={idpMetadata.sso_service_url} />
      </div>

      <AkDivider color="dark" />

      <div className="p-3.5">
        <SsoSectionHeading icon="material-symbols:verified">
          {akMT('certificate')}
        </SsoSectionHeading>
      </div>

      <AkDivider color="dark" />

      <div className="flex flex-col gap-3.5 p-3.5">
        <SsoField label={akMT('issuer')} value={idpMetadata.certificate.issuer} />

        <SsoField label={akMT('issuedOn')} value={writeDate(idpMetadata.certificate.issued_on)} />

        <SsoField label={akMT('expiry')} value={writeDate(idpMetadata.certificate.expires_on)} />

        <div className="flex flex-col">
          <AkTypography variant="subtitle2">{akMT('fingerprints')}</AkTypography>

          <div data-test-sso-saml-idp-sha256>
            <AkTypography tag="span" variant="subtitle2">
              {`${akMT('SHA256')} `}
            </AkTypography>

            <AkTypography tag="span" variant="body2" color="textSecondary">
              {idpMetadata.certificate.fingerprint_sha256}
            </AkTypography>
          </div>

          <div data-test-sso-saml-idp-sha1>
            <AkTypography tag="span" variant="subtitle2">
              {`${akMT('SHA1')} `}
            </AkTypography>

            <AkTypography tag="span" variant="body2" color="textSecondary">
              {idpMetadata.certificate.fingerprint_sha1}
            </AkTypography>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Where the identity provider's XML is dropped or chosen, and then edited before upload. */
export function IdpMetadataUpload({
  organizationId,
}: Readonly<{ organizationId: number | undefined }>) {
  const queryClient = useQueryClient();

  const [xml, setXml] = useState('');
  const [isReading, setIsReading] = useState(false);

  const upload = useMutation({
    mutationFn: (document: string) =>
      OrganizationService.uploadSamlIdpMetadata(Number(organizationId), document),

    onSuccess: async () => {
      akNotify.success(akMT('ssoSettings.saml.successMessage'));
      setXml('');

      await queryClient.invalidateQueries({
        queryKey: organizationKeys.samlIdpMetadata(organizationId),
      });
    },

    onError: (error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    },
  });

  const readFile = async (file: File | undefined) => {
    if (file === undefined) {
      return;
    }

    setIsReading(true);
    setXml(await file.text());
    setIsReading(false);
  };

  const send = () => {
    const parsed = new DOMParser().parseFromString(xml, 'application/xml');

    if (parsed.querySelector('parsererror') !== null) {
      akNotify.error(akMT('xmlError'));

      return;
    }

    upload.mutate(xml);
  };

  if (isReading) {
    return (
      <div
        className="flex items-center justify-center gap-2.75 p-7"
        data-test-sso-saml-idp-processing
      >
        <AkSpinner className="size-3.5" />

        <AkTypography>{akMT('processing')}</AkTypography>
      </div>
    );
  }

  if (xml !== '') {
    return (
      <div className="flex w-full flex-col">
        <AkTypography variant="body2" color="textSecondary" className="p-3.5">
          {akMT('idpMetadataEdit')}
        </AkTypography>

        <AkDivider color="dark" />

        <form
          noValidate
          className="flex flex-col gap-3.5 p-3.5"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <AkTextarea
            id="idp-metadata-xml-input"
            rows={10}
            value={xml}
            placeholder="IdP Metadata XML Content"
            onChange={(event) => setXml(event.target.value)}
            data-test-sso-saml-idp-xml-input
          />

          <div className="flex items-center gap-2.75">
            <AkButton type="submit" loading={upload.isPending} data-test-sso-saml-idp-submit>
              {akMT('upload')}
            </AkButton>

            <AkButton
              type="button"
              variant="outlined"
              color="neutral"
              disabled={upload.isPending}
              onClick={() => setXml('')}
              data-test-sso-saml-idp-cancel
            >
              {akMT('cancel')}
            </AkButton>
          </div>
        </form>
      </div>
    );
  }

  const takeDroppedFile = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    void readFile(event.dataTransfer.files[0]);
  };

  const takeChosenFile = (event: ChangeEvent<HTMLInputElement>) => {
    void readFile(event.target.files?.[0]);
  };

  return (
    <div className="flex w-full flex-col">
      <AkTypography
        variant="body2"
        color="textSecondary"
        className="p-3.5"
        data-test-sso-saml-idp-upload-text
      >
        {akMT('idpMetadataUpload')}
      </AkTypography>

      <AkDivider color="dark" />

      <div
        className="flex flex-col items-center justify-center gap-3.5 p-3.5"
        onDrop={takeDroppedFile}
        onDragOver={(event) => event.preventDefault()}
        data-test-sso-saml-idp-dropzone
      >
        <AkIcon name="mdi:insert-drive-file" className="size-8" aria-hidden />

        <div className="flex items-center gap-1.75">
          <AkIcon name="material-symbols:file-upload" className="size-4.75" aria-hidden />

          <AkTypography>{akMT('dragDropFile')}</AkTypography>

          <AkTypography color="textSecondary">{akMT('or')}</AkTypography>
        </div>

        <AkButton asChild variant="outlined">
          <label className="cursor-pointer" data-test-sso-saml-idp-browse>
            {akMT('browseFiles')}

            <input
              type="file"
              accept="text/xml"
              className="hidden"
              aria-label={akMT('browseFiles')}
              onChange={takeChosenFile}
              data-test-sso-saml-idp-file-input
            />
          </label>
        </AkButton>
      </div>
    </div>
  );
}
