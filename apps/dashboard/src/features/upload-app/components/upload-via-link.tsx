import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  AkModal,
  AkModalBody,
  AkModalContent,
  AkModalFooter,
  AkModalHeader,
  AkModalTrigger,
} from '@irene/ui/ak-modal';

import { UploadAppService } from '@irene/api/services/upload-app';
import { getApiErrorStatus } from '@irene/api/utils/errors';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkChip } from '@irene/ui/ak-chip';
import { AkFormProvider } from '@irene/ui/ak-form';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkInput } from '@irene/ui/ak-input';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import {
  buildStoreLinkSchema,
  StoreLinkFormField,
  type StoreLinkFormSchema,
} from '@/features/upload-app/schemas/store-link';

import { useUploadAppStore } from '@/features/upload-app/store';
import { useOrganization } from '@/hooks/use-organization';

/** The formats the modal says a link can take. */
const VALID_STORE_LINK_FORMATS = [
  'https://play.google.com/store/apps/details?id={package_name}',
  'https://apps.apple.com/{country_code}/app/{app_slug}/id{app_id}',
];

/**
 * Uploads an app the person links to, rather than one they have a copy of.
 *
 * The server fetches the app from the store itself, so all this sends is the
 * link. What becomes of it is reported the same way as any other upload: as a
 * submission, over the socket.
 */
export function UploadViaLink() {
  const [isModalOpen, setModalOpen] = useState(false);

  const organizationId = useOrganization().selected?.id;
  const uploadAppStore = useUploadAppStore();

  const storeLinkForm = useForm<StoreLinkFormSchema>({
    resolver: zodResolver(buildStoreLinkSchema()),
    defaultValues: { url: '' },
    mode: 'onChange',
  });

  const { mutate: uploadAppFromStore, isPending: isUploading } = useMutation({
    mutationFn: ({ url }: StoreLinkFormSchema) =>
      UploadAppService.uploadFromStore(url, { organizationId: organizationId ?? '' }),

    onSuccess: () => {
      closeModal();
      uploadAppStore.setShouldOpenUploadList(true);
    },

    onError: (error) => {
      /* A throttled account is already being counted down by the rate-limit notice. */
      if (getApiErrorStatus(error) !== HTTP_STATUS_CODES.TOO_MANY_REQUESTS) {
        akNotify.error(akMT('pleaseTryAgain'));
      }
    },
  });

  const closeModal = () => {
    setModalOpen(false);
    storeLinkForm.reset();
  };

  return (
    <AkModal
      open={isModalOpen}
      onOpenChange={(isOpen) => (isOpen ? setModalOpen(true) : closeModal())}
    >
      <AkModalTrigger asChild>
        <AkButton
          variant="outlined"
          color="textPrimary"
          size="icon"
          title={akMT('uploadAppModule.linkUploadPopupHeader')}
          aria-label={akMT('uploadAppModule.linkUploadPopupHeader')}
          data-test-upload-via-link
        >
          <AkIcon name="material-symbols:link" className="size-4.5" />
        </AkButton>
      </AkModalTrigger>

      <AkModalContent data-test-upload-via-link-modal>
        <AkModalHeader
          title={akMT('uploadAppModule.linkUploadPopupHeader')}
          closeLabel={akMT('close')}
        >
          <AkChip color="primary" variant="filled" size="small" label={akMT('beta')} />
        </AkModalHeader>

        <AkFormProvider {...storeLinkForm}>
          <form
            noValidate
            onSubmit={storeLinkForm.handleSubmit((link) => uploadAppFromStore(link))}
          >
            <AkModalBody className="flex w-112.5 flex-col gap-3.5">
              <StoreLinkFormField name="url" label={akMT('uploadAppModule.linkInputLabel')}>
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
      </AkModalContent>
    </AkModal>
  );
}
