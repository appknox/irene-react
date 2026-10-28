import { API_NAMESPACES } from '@irene/api/namespaces';

/** Paths for the project endpoints. */
export const ProjectEndpoints = {
  list: () => `${API_NAMESPACES.v3}/projects` as const,

  /** One project, which the file list and its settings hang off. */
  detail: (id: number | string) =>
    `${API_NAMESPACES.v3}/projects/${encodeURIComponent(id)}` as const,
};
