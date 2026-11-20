import { API_NAMESPACES } from '@irene/api/namespaces';

/** Paths for one scanned file on Appknox, which every feature showing a scan reads. */
export const FileEndpoints = {
  /** One file: its name, version and when it was uploaded. */
  detail: (fileId: number | string) =>
    `${API_NAMESPACES.v3}/files/${encodeURIComponent(fileId)}` as const,

  /** The finding counts of one file, by severity. */
  risk: (fileId: number | string) =>
    `${API_NAMESPACES.v3}/files/${encodeURIComponent(fileId)}/risk` as const,
};
