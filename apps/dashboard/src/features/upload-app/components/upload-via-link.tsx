import { useState } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkChip } from '@irene/ui/ak-chip';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkModal, AkModalContent, AkModalHeader, AkModalTrigger } from '@irene/ui/ak-modal';
import { akNotify } from '@irene/ui/notify';

import { useUploadAppStore } from '@/features/upload-app/store';
import { useProductFeatureId } from '@/hooks/use-product-feature-id';

import { StoreLinkForm } from './store-link-form';

/**
 * Uploads an app the person links to, rather than one they have a copy of.
 *
 * The server fetches the app from the store itself, so all this sends is the
 * link. What becomes of it is reported the same way as any other upload: as a
 * submission, over the socket.
 */
export function UploadViaLink() {
  const [isModalOpen, setModalOpen] = useState(false);
  const uploadAppStore = useUploadAppStore();
  const isOffsec = useProductFeatureId() === 'offensive-security';

  const handleUploaded = () => {
    setModalOpen(false);

    // The offsec queue holds no submission for this link until the server reports one.
    if (isOffsec) {
      akNotify.success(akMT('uploadAppModule.offsecLinkUploadStarted'));
    } else {
      uploadAppStore.setShouldOpenUploadList(true);
    }
  };

  return (
    <AkModal open={isModalOpen} onOpenChange={setModalOpen}>
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

        <StoreLinkForm onUploaded={handleUploaded} />
      </AkModalContent>
    </AkModal>
  );
}
