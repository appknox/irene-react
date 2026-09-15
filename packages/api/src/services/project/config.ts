import { API_NAMESPACES } from '@irene/api/namespaces';

/** Paths for the project endpoints. */
export const ProjectEndpoints = {
  list: () => `${API_NAMESPACES.v3}/projects` as const,

  detail: (id: number | string) =>
    `${API_NAMESPACES.v3}/projects/${encodeURIComponent(id)}` as const,
};

/** Query key for a page of projects. */
export const PROJECT_LIST_QUERY_KEY = 'PROJECT_LIST_QUERY_KEY';
/** Query key for one project. */
export const PROJECT_QUERY_KEY = 'PROJECT_QUERY_KEY';
