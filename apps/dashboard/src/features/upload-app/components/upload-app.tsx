import { akMT } from '@irene/translations/intl';
import { AkTypography } from '@irene/ui/ak-typography';

import { useOrganization } from '@/hooks/use-organization';

import { UploadStatus } from './upload-status';
import { UploadViaLink } from './upload-via-link';
import { UploadViaSystem } from './upload-via-system';

/**
 * Starting a scan: the ways to upload an app, and what became of the last ones.
 *
 * It sits at the left of the top bar, where every signed-in page can reach it,
 * because an upload is started from wherever the account happens to be.
 */
export function UploadApp() {
  const { features } = useOrganization();
  const canUploadViaLink = features().upload_via_url;

  return (
    <div className="flex items-center gap-1.75" data-test-upload-app>
      <AkTypography color="inherit" data-test-upload-app-label>
        {akMT('startNewScan')}
      </AkTypography>

      <UploadViaSystem />

      {/* Uploading from a store link is sold separately, so not every organization has it. */}
      {canUploadViaLink && <UploadViaLink />}

      <UploadStatus />
    </div>
  );
}
