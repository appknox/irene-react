import { queryOptions } from '@tanstack/react-query';

import { ProjectService } from '@irene/api/services/project';

/** The cache keys for projects. */
export const projectKeys = {
  all: () => ['project'] as const,
  detail: (projectId: number | string) => [...projectKeys.all(), 'detail', projectId] as const,
};

/**
 * Builds the query for one project.
 *
 * Held indefinitely: a package name and platform do not change under a screen
 * that is only naming the project beside something else.
 *
 * @param projectId - The project to read.
 * @returns Query options resolving to the project.
 */
export const projectOptions = (projectId: number | string) =>
  queryOptions({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => ProjectService.getProject(projectId),
    staleTime: Infinity,
  });
