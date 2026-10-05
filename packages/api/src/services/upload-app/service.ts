import axios from 'axios';

import { apiRequest } from '@irene/api/request';

import type {
  ApiPresignedUpload,
  ApiUploadedApp,
  ApiUploadedAppUrl,
} from '@irene/api/services/upload-app';

import { UploadAppEndpoints } from './endpoints';

/** What the binary upload needs: where to put it, and what to put there. */
interface FileBinaryUploadOptions {
  url: string;
  file: File;
  onProgress?: (percent: number) => void;
}

/** Which queue an upload joins. */
interface UploadOptions {
  organizationId: number | string;
  isOffsec?: boolean;
}

/** Resolves the endpoint to upload a binary to. */
function _resolveUploadAppEndpoint({ organizationId, isOffsec }: UploadOptions) {
  return isOffsec
    ? UploadAppEndpoints.offsecUpload(organizationId)
    : UploadAppEndpoints.upload(organizationId);
}

/** Resolves the endpoint to upload a store listing to. */
function _resolveStoreUploadEndpoint({ organizationId, isOffsec }: UploadOptions) {
  return isOffsec
    ? UploadAppEndpoints.offsecUploadFromStore(organizationId)
    : UploadAppEndpoints.uploadFromStore(organizationId);
}

/** Uploads app binaries, in the three steps the server expects. */
export default class UploadAppService {
  /**
   * Asks where to upload a binary.
   *
   * @param options.organizationId - The organization the app belongs to.
   * @param options.isOffsec - Whether this joins the offensive-security queue.
   * @returns The URL to upload to, and the key naming the upload.
   */
  public static readonly getPresignedUpload = (options: UploadOptions) =>
    apiRequest.get<ApiPresignedUpload>(_resolveUploadAppEndpoint(options));

  /**
   * Uploads the binary itself.
   *
   * Sent with a bare client rather than the API's. The URL is already signed,
   * and storage refuses a request that also carries our `Authorization` header
   * — "only one auth mechanism allowed". The API client would add one, and
   * would read a refusal from storage as this session having ended.
   *
   * @param options.url - The signed URL the server answered with.
   * @param options.file - The binary the person chose.
   * @param options.onProgress - Called with how much of the file has gone, as a percentage.
   */
  public static readonly uploadBinary = async ({
    url,
    file,
    onProgress,
  }: FileBinaryUploadOptions) => {
    await axios.put(url, file, {
      withCredentials: false,
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      onUploadProgress: ({ loaded, total }) =>
        onProgress?.(Math.round((loaded / (total ?? file.size)) * 100)),
    });
  };

  /**
   * Tells the server the upload finished, which is what creates the submission.
   *
   * @param upload - The keys naming the binary now in storage.
   * @param options.organizationId - The organization the app belongs to.
   * @param options.isOffsec - Whether this joins the offensive-security queue.
   * @returns The submission the server created for it.
   */
  public static readonly confirmUpload = (
    upload: Pick<ApiPresignedUpload, 'file_key' | 'file_key_signed'>,
    options: UploadOptions
  ) => apiRequest.post<ApiUploadedApp>(_resolveUploadAppEndpoint(options), upload);

  /**
   * Asks the server to fetch an app from a store, by the link to it.
   *
   * The server downloads the app itself, so there is no binary to send and no
   * URL to ask for: this one call is the whole upload.
   *
   * @param url - The store listing to fetch the app from.
   * @param options.organizationId - The organization the app belongs to.
   * @param options.isOffsec - Whether this joins the offensive-security queue.
   * @returns The upload the server created for it.
   */
  public static readonly uploadFromStore = (url: string, options: UploadOptions) =>
    apiRequest.post<ApiUploadedAppUrl>(_resolveStoreUploadEndpoint(options), { url });
}
