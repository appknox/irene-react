import { apiRequest } from '@irene/api/request';
import { transformPaginatedResponse } from '@irene/api/utils/transforms';
import type { ApiProject, ApiProjectListRequest } from '@irene/api/services/project';
import type { ApiPageEnvelope } from '@irene/api/utils/pagination';

import { ProjectEndpoints } from './config';

/** Talks to the project endpoints. */
export default class ProjectService {
  /**
   * Fetches a page of projects and unwraps the DRF envelope.
   * @param params - The page size, offset and search text.
   * @returns The projects on the page, the total count, and whether more pages exist either side.
   */
  public static readonly getProjects = async (params: ApiProjectListRequest) => {
    const url = ProjectEndpoints.list();
    const page = await apiRequest.get<ApiPageEnvelope<ApiProject>>(url, { params });

    return transformPaginatedResponse(page);
  };

  /**
   * Fetches one project.
   * @param id - The project id.
   * @returns The project.
   */
  public static readonly getProject = (id: number | string) =>
    apiRequest.get<ApiProject>(ProjectEndpoints.detail(id));
}
