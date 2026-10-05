import { UploadAppService } from '@irene/api/services/upload-app';

/** What one upload needs to know. */
interface UploadAppOptions {
  file: File;
  organizationId: number | string;
  isOffsec?: boolean;
  onProgress?: (percent: number) => void;
}

/** The binaries the server accepts. */
export const UPLOADABLE_EXTENSIONS = ['apk', 'aab', 'ipa'] as const;

/**
 * Whether the server would accept this binary.
 *
 * Checked here as well as there, so a wrong file is refused before it is sent
 * rather than after a long upload.
 *
 * @param file - The file the person chose.
 * @returns Whether it is a kind of app the server accepts.
 */
export function isUploadableApp(file: File) {
  const extension = file.name.toLowerCase().split('.').pop();

  return UPLOADABLE_EXTENSIONS.includes(extension as (typeof UPLOADABLE_EXTENSIONS)[number]);
}

/**
 * Uploads an app in three requests: GET /upload_app for a presigned S3 URL,
 * PUT of the binary to S3, then POST /upload_app to confirm it.
 *
 * The POST creates the submission that the status popover and the socket read.
 *
 * Both requests to our own server name the same queue, so the binary is
 * confirmed into the queue it was granted a URL for.
 *
 * @param options.file - The binary to upload.
 * @param options.organizationId - The organization the app belongs to.
 * @param options.isOffsec - Whether this joins the offensive-security queue.
 * @param options.onProgress - Called with how much of the file has gone.
 * @returns The submission the server created.
 */
export async function uploadAppBinary({
  file,
  organizationId,
  isOffsec,
  onProgress,
}: UploadAppOptions) {
  const presignedUpload = await UploadAppService.getPresignedUpload({ organizationId, isOffsec });

  await UploadAppService.uploadBinary({ url: presignedUpload.url, file, onProgress });

  return UploadAppService.confirmUpload(
    { file_key: presignedUpload.file_key, file_key_signed: presignedUpload.file_key_signed },
    { organizationId, isOffsec }
  );
}
