import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { UploadAppService } from '@irene/api/services/upload-app';
import { getApiErrorStatus } from '@irene/api/utils/errors';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkFormProvider } from '@irene/ui/ak-form';
import { AkInput } from '@irene/ui/ak-input';
import { AkModalBody, AkModalFooter } from '@irene/ui/ak-modal';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import {
  buildStoreLinkSchema,
  StoreLinkFormField,
  type StoreLinkFormSchema,
} from '@/features/upload-app/schemas/store-link';

import { useOrganization } from '@/hooks/use-organization';
import { useProductFeatureId } from '@/hooks/use-product-feature-id';

/** The formats the modal says a link can take. */
const VALID_STORE_LINK_FORMATS = [
  'https://play.google.com/store/apps/details?id={package_name}',
  'https://apps.apple.com/{country_code}/app/{app_slug}/id{app_id}',
];

interface StoreLinkFormProps {
  onUploaded: () => void;
}

/**
 * Asks for a store link and sends it.
 *
 * It holds the form rather than the modal around it, so closing the modal
 * unmounts the form and the next opening starts from nothing. Resetting it
 * from outside instead would write to a form being taken off the page.
 *
 * @param props.isOffsec - Whether the link starts an offensive-security run.
 * @param props.onUploaded - Called once the server has the link.
 */
export function StoreLinkForm({ onUploaded }: Readonly<StoreLinkFormProps>) {
  const organizationId = useOrganization().selectedId();
  const isOffsec = useProductFeatureId() === 'offensive-security';

  const storeLinkForm = useForm<StoreLinkFormSchema>({
    resolver: zodResolver(buildStoreLinkSchema(isOffsec)),
    defaultValues: { url: '' },
    mode: 'onChange',
  });

  const { mutate: uploadAppFromStore, isPending: isUploading } = useMutation({
    mutationFn: ({ url }: StoreLinkFormSchema) =>
      UploadAppService.uploadFromStore(url, { organizationId, isOffsec }),

    onSuccess: onUploaded,

    onError: (error) => {
      /* A throttled account is already being counted down by the rate-limit notice. */
      if (getApiErrorStatus(error) !== HTTP_STATUS_CODES.TOO_MANY_REQUESTS) {
        akNotify.error(akMT('pleaseTryAgain'));
      }
    },
  });

  return (
    <AkFormProvider {...storeLinkForm}>
      <form noValidate onSubmit={storeLinkForm.handleSubmit((link) => uploadAppFromStore(link))}>
        <AkModalBody className="flex w-112.5 flex-col gap-3.5">
          <StoreLinkFormField
            name="url"
            label={akMT('uploadAppModule.linkInputLabel')}
            labelProps={{ className: 'text-md font-semibold' }}
          >
            <AkInput
              autoFocus
              placeholder={akMT('uploadAppModule.linkPastePlaceholder')}
              data-test-upload-via-link-input
            />
          </StoreLinkFormField>

          <AkTypography variant="subtitle2" data-test-upload-via-link-stores>
            {`${akMT('uploadAppModule.supportedStores')}: `}

            <AkTypography variant="body2" tag="span">
              {akMT('uploadAppModule.stores')}
            </AkTypography>
          </AkTypography>

          <div className="flex flex-col">
            <AkTypography variant="subtitle2">
              {akMT('uploadAppModule.validURLFormatTitle')}
            </AkTypography>

            <ul className="list-disc pl-4.5">
              {VALID_STORE_LINK_FORMATS.map((format) => (
                <li key={format}>
                  <AkTypography variant="body2">{format}</AkTypography>
                </li>
              ))}
            </ul>
          </div>
        </AkModalBody>

        <AkModalFooter className="px-5.25 py-3.5">
          <AkButton
            type="submit"
            className="w-fit"
            loading={isUploading}
            disabled={!storeLinkForm.formState.isValid}
            data-test-upload-via-link-confirm
          >
            {akMT('upload')}
          </AkButton>
        </AkModalFooter>
      </form>
    </AkFormProvider>
  );
}
