import { AkSkeleton } from '@irene/ui/ak-skeleton';

/**
 * Where the app's icon and name will go once the server has read the binary.
 *
 * An upload is announced before anything is known about what it contains, so
 * the row stands at its full height from the start rather than growing as the
 * details arrive.
 */
export function UploadRowAppPending() {
  return (
    <div className="flex items-center px-3.5 py-1.75" data-test-upload-status-app-pending>
      <AkSkeleton variant="circular" width="40px" height="40px" />

      <div className="flex flex-col gap-1.75 pl-1.75">
        <AkSkeleton width="280px" height="16px" />

        <AkSkeleton width="215px" height="16px" />
      </div>
    </div>
  );
}
