import { useMutation } from '@tanstack/react-query';
import { Fragment, useRef, type ChangeEvent } from 'react';

import { getApiErrorStatus } from '@irene/api/utils/errors';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { akNotify } from '@irene/ui/notify';

import {
  isUploadableApp,
  UPLOADABLE_EXTENSIONS,
  uploadAppBinary,
} from '@/features/upload-app/actions/upload';

import { useUploadAppStore } from '@/features/upload-app/store';
import { useOrganization } from '@/hooks/use-organization';

/** What the file picker offers, as the input wants it. */
const ACCEPTED_EXTENSIONS = UPLOADABLE_EXTENSIONS.map((extension) => `.${extension}`).join(',');

/**
 * Uploads an app the person picks from their machine.
 *
 * The server reports what becomes of the upload over the socket, so this says
 * only that the upload itself was accepted, then tells the status popover a
 * submission now exists.
 */
export function UploadViaSystem() {
  const fileInput = useRef<HTMLInputElement>(null);
  const organizationId = useOrganization().selected?.id;
  const uploadAppStore = useUploadAppStore();

  // Upload the file to the server
  const { mutate: uploadFile } = useMutation({
    mutationFn: async (file: File) => {
      const uploadId = uploadAppStore.startUpload(file.name);

      try {
        await uploadAppBinary({
          file,
          organizationId: organizationId ?? '',
          onProgress: (progress) => uploadAppStore.setUploadProgress(uploadId, progress),
        });
      } catch (error) {
        uploadAppStore.finishUpload(uploadId);

        throw error;
      }

      return uploadId;
    },

    onSuccess: (uploadId) => {
      akNotify.success(akMT('fileUploadedSuccessfully'));
      uploadAppStore.finishUpload(uploadId);
    },

    onError: (error) => {
      if (getApiErrorStatus(error) !== HTTP_STATUS_CODES.TOO_MANY_REQUESTS) {
        akNotify.error(akMT('errorWhileUploading'));
      }
    },
  });

  // Handle the file chosen event
  const handleFileChosen = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    // Throw an error if the file is not uploadable
    if (file && isUploadableApp(file)) {
      uploadFile(file);
    } else {
      akNotify.error(akMT('invalidFileType'));
    }
  };

  return (
    <Fragment>
      <AkButton
        variant="filled"
        color="primary"
        leftIcon={<AkIcon name="material-symbols:cloud-upload" className="size-4" />}
        onClick={() => fileInput.current?.click()}
        data-test-upload-via-system
      >
        {akMT('uploadApp')}
      </AkButton>

      <input
        ref={fileInput}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        onChange={handleFileChosen}
        className="hidden"
        data-test-upload-via-system-input
      />
    </Fragment>
  );
}
