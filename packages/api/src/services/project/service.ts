import { apiRequest } from '@irene/api/request';
import type { ApiPage, DrfPageResponse } from '@irene/api/types/pagination';
import type { Project, ProjectListParams } from '@irene/api/types/project';

import { ProjectEndpoints } from './config';

/** Talks to the project endpoints. */
export default class ProjectService {
  /**
   * Fetches a page of projects and unwraps the DRF envelope.
   *
   * @param params - The page size, offset and search text.
   * @returns The projects on the page, the total count, and whether more pages exist either side.
   */
  public static readonly list = async (params: ProjectListParams): Promise<ApiPage<Project>> => {
    const page = await apiRequest.get<DrfPageResponse<Project>>(ProjectEndpoints.list(), {
      params,
    });

    return {
      items: page.results ?? [],
      count: page.count ?? 0,
      hasNext: Boolean(page.next),
      hasPrevious: Boolean(page.previous),
    };
  };

  /**
   * Fetches one project.
   *
   * @param id - The project id.
   * @returns The project.
   */
  public static readonly detail = (id: number | string): Promise<Project> =>
    apiRequest.get(ProjectEndpoints.detail(id));
}
