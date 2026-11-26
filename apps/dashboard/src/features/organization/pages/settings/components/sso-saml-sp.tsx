import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkLabel } from '@irene/ui/ak-label';
import { AkRadio, AkRadioGroup } from '@irene/ui/ak-radio';
import { AkTextarea } from '@irene/ui/ak-textarea';
import { AkTypography } from '@irene/ui/ak-typography';

import { samlSpMetadataOptions } from '@/queries/organization';

import { SsoBox, SsoBoxSection } from './sso-pieces';

/** How the fields Appknox publishes are read: as fields, or as the XML itself. */
type SpConfigFormat = 'manual' | 'xml';

/** What Appknox publishes about itself, which the identity provider is configured from. */
export function ServiceProviderBox() {
  const spMetadata = useQuery(samlSpMetadataOptions());

  const [format, setFormat] = useState<SpConfigFormat>('manual');

  const fields = [
    { label: akMT('entityID'), value: spMetadata.data?.entity_id ?? '' },
    { label: akMT('acsURL'), value: spMetadata.data?.acs_url ?? '' },
    { label: akMT('nameIDFormat'), value: spMetadata.data?.named_id_format ?? '' },
  ];

  return (
    <SsoBox testAttribute="sso-saml-sp">
      <SsoBoxSection>
        <AkTypography variant="subtitle1" data-test-sso-saml-sp-title>
          {akMT('serviceProvider')}
        </AkTypography>

        <AkTypography variant="body2" color="textSecondary" data-test-sso-saml-sp-description>
          {akMT('spMetadataDesc')}
        </AkTypography>
      </SsoBoxSection>

      <div className="flex items-end justify-between gap-3.5 px-3.5 pt-3.5">
        <AkRadioGroup
          className="flex flex-row gap-5.25"
          value={format}
          onValueChange={(value) => setFormat(value as SpConfigFormat)}
        >
          <div className="flex items-center gap-1.75">
            <AkRadio value="manual" id="sp-config-manual" data-test-sso-saml-sp-manual />

            <AkLabel htmlFor="sp-config-manual">{akMT('manualSettings')}</AkLabel>
          </div>

          <div className="flex items-center gap-1.75">
            <AkRadio value="xml" id="sp-config-xml" data-test-sso-saml-sp-xml />

            <AkLabel htmlFor="sp-config-xml">{akMT('xmlMetadata')}</AkLabel>
          </div>
        </AkRadioGroup>

        {format === 'xml' && (
          <AkIconButton
            type="button"
            variant="outlined"
            aria-label={akMT('copy')}
            onClick={() => void navigator.clipboard.writeText(spMetadata.data?.metadata ?? '')}
            data-test-sso-saml-sp-copy
          >
            <AkIcon name="material-symbols:content-copy-outline" className="text-info" />
          </AkIconButton>
        )}
      </div>

      <div className="p-3.5">
        {format === 'manual' ? (
          <div className="flex flex-col rounded-xs border border-border">
            {fields.map((field, index) => (
              <div key={field.label} className="flex w-full flex-col">
                <div className="flex w-full">
                  <div className="w-4/12 p-3.5">
                    <AkTypography variant="subtitle2" data-test-sso-saml-sp-label>
                      {field.label}
                    </AkTypography>
                  </div>

                  <div className="w-8/12 p-3.5">
                    <AkTypography variant="body2" color="textSecondary" data-test-sso-saml-sp-value>
                      {field.value}
                    </AkTypography>
                  </div>
                </div>

                {index < fields.length - 1 && <AkDivider color="dark" />}
              </div>
            ))}
          </div>
        ) : (
          <AkTextarea
            id="sp-config-xml-input"
            rows={8}
            disabled
            value={spMetadata.data?.metadata ?? ''}
            readOnly
            data-test-sso-saml-sp-xml-input
          />
        )}
      </div>
    </SsoBox>
  );
}
