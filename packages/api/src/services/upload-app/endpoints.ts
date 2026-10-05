import { API_NAMESPACES } from '@irene/api/namespaces';

/** Paths for putting an app binary into the system. */
export const UploadAppEndpoints = {
  /**
   * GET returns a presigned S3 URL and its keys; POST sends those keys back
   * once the binary is in S3, which creates the submission.
   */
  upload: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/upload_app` as const,

  /** Where an app is uploaded from a store listing, by the link to it. */
  uploadFromStore: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/upload_app_url` as const,

  /** The same, for an offensive-security upload, which is a separate queue. */
  offsecUpload: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/offsec/upload_app` as const,

  /** Where an offensive-security app is uploaded from a store listing. */
  offsecUploadFromStore: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/offsec/upload_app_url` as const,
};
