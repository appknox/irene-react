import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { HTTP_STATUS_CODES } from '@irene/constants';

import { ProjectEndpoints, ProjectService } from '@irene/api/services/project';
import { getApiErrorStatus } from '@irene/api/utils/errors';
import { buildProject } from '@tests/factories';
import { buildAPITestURL, server } from '@tests/server';
import { buildDrfPage } from '@tests/utils';

const LIST_URL = buildAPITestURL(ProjectEndpoints.list());
const detailUrl = (id: string) => buildAPITestURL(ProjectEndpoints.detail(id));

/** Captures the query string msw received, so assertions can read the params. */
function interceptList(respond: () => Response) {
  const seen: { params: URLSearchParams } = { params: new URLSearchParams() };

  server.use(
    http.get(LIST_URL, ({ request }) => {
      seen.params = new URL(request.url).searchParams;

      return respond();
    })
  );

  return seen;
}

describe('ProjectService.list', () => {
  describe('when projects are returned', () => {
    it('gets the v3 projects endpoint', async () => {
      interceptList(() => HttpResponse.json(buildDrfPage([buildProject()])));

      await expect(ProjectService.getProjects({ limit: 9, offset: 0 })).resolves.toBeDefined();
    });

    it('sends limit and offset as query params', async () => {
      const seen = interceptList(() => HttpResponse.json(buildDrfPage([])));

      await ProjectService.getProjects({ limit: 9, offset: 18 });

      expect(seen.params.get('limit')).toBe('9');
      expect(seen.params.get('offset')).toBe('18');
    });

    it('sends q only when a search term is given', async () => {
      const withoutTerm = interceptList(() => HttpResponse.json(buildDrfPage([])));
      await ProjectService.getProjects({ limit: 9, offset: 0 });
      expect(withoutTerm.params.has('q')).toBe(false);

      const withTerm = interceptList(() => HttpResponse.json(buildDrfPage([])));
      await ProjectService.getProjects({ limit: 9, offset: 0, q: 'appknox' });
      expect(withTerm.params.get('q')).toBe('appknox');
    });

    it('returns the results as items with a count', async () => {
      const projects = [buildProject()];
      const next = '/api/v3/projects?offset=9';

      interceptList(() => HttpResponse.json(buildDrfPage(projects, { count: 40, next })));

      await expect(ProjectService.getProjects({ limit: 9, offset: 0 })).resolves.toEqual({
        items: projects,
        count: 40,
        hasNext: true,
        hasPrevious: false,
        nextUrl: next,
        previousUrl: null,
      });
    });
  });

  describe('when the request fails', () => {
    it('rejects with a 403 for an organization the account cannot see', async () => {
      interceptList(() =>
        HttpResponse.json({ detail: 'Forbidden' }, { status: HTTP_STATUS_CODES.FORBIDDEN })
      );

      const error = await ProjectService.getProjects({ limit: 9, offset: 0 }).catch(
        (reason: unknown) => reason
      );

      expect(getApiErrorStatus(error)).toBe(HTTP_STATUS_CODES.FORBIDDEN);
    });

    it('rejects on a 500', async () => {
      interceptList(() =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      );

      await expect(ProjectService.getProjects({ limit: 9, offset: 0 })).rejects.toThrow('500');
    });
  });
});

describe('ProjectService.detail', () => {
  it('gets a single project by id', async () => {
    const project = buildProject({ id: 42 });

    server.use(http.get(detailUrl('42'), () => HttpResponse.json(project)));

    await expect(ProjectService.getProject(42)).resolves.toEqual(project);
  });

  it('encodes an id that would otherwise change the path', async () => {
    // The builder escapes it, exactly as the service does.
    server.use(http.get(detailUrl('a/b'), () => HttpResponse.json(buildProject())));

    await expect(ProjectService.getProject('a/b')).resolves.toBeDefined();
  });

  it('rejects with a 404 for a project that does not exist', async () => {
    server.use(
      http.get(detailUrl('9999'), () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.NOT_FOUND })
      )
    );

    await expect(ProjectService.getProject(9999)).rejects.toThrow('404');
  });
});

describe('ProjectService.list', () => {
  it('returns the results as items with a count', async () => {
    const projects = [buildProject(), buildProject()];

    interceptList(() => HttpResponse.json(buildDrfPage(projects, { count: 40 })));

    const page = await ProjectService.getProjects({ limit: 9, offset: 0 });

    expect(page.items).toEqual(projects);
    expect(page.count).toBe(40);
  });

  it('reports hasNext from the next URL', async () => {
    interceptList(() =>
      HttpResponse.json(
        buildDrfPage([buildProject()], { next: '/api/v3/projects?offset=9', previous: null })
      )
    );

    const page = await ProjectService.getProjects({ limit: 9, offset: 0 });

    expect(page.hasNext).toBe(true);
    expect(page.hasPrevious).toBe(false);
  });

  it('returns an empty page when the response carries no results', async () => {
    interceptList(() => HttpResponse.json(buildDrfPage([])));

    const page = await ProjectService.getProjects({ limit: 9, offset: 0 });

    expect(page.items).toEqual([]);
    expect(page.count).toBe(0);
  });

  it('rejects rather than returning an empty page', async () => {
    interceptList(() => HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR }));

    await expect(ProjectService.getProjects({ limit: 9, offset: 0 })).rejects.toThrow('500');
  });
});
