import { http, HttpResponse } from 'msw';
import { isAxiosError } from 'axios';
import { describe, expect, it } from 'vitest';

import { buildProject } from '@tests/factories';
import { apiUrl, server } from '@tests/server';
import { buildDrfPage } from '@tests/utils';
import { ProjectService } from '@irene/api/services/project';

const LIST_URL = apiUrl('api/v3/projects');
const detailUrl = (id: string) => apiUrl(`api/v3/projects/${id}`);

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

      await expect(ProjectService.list({ limit: 9, offset: 0 })).resolves.toBeDefined();
    });

    it('sends limit and offset as query params', async () => {
      const seen = interceptList(() => HttpResponse.json(buildDrfPage([])));

      await ProjectService.list({ limit: 9, offset: 18 });

      expect(seen.params.get('limit')).toBe('9');
      expect(seen.params.get('offset')).toBe('18');
    });

    it('sends q only when a search term is given', async () => {
      const withoutTerm = interceptList(() => HttpResponse.json(buildDrfPage([])));
      await ProjectService.list({ limit: 9, offset: 0 });
      expect(withoutTerm.params.has('q')).toBe(false);

      const withTerm = interceptList(() => HttpResponse.json(buildDrfPage([])));
      await ProjectService.list({ limit: 9, offset: 0, q: 'appknox' });
      expect(withTerm.params.get('q')).toBe('appknox');
    });

    it('unwraps the envelope into items and count', async () => {
      const projects = [buildProject()];

      interceptList(() =>
        HttpResponse.json(buildDrfPage(projects, { count: 40, next: '/api/v3/projects?offset=9' }))
      );

      await expect(ProjectService.list({ limit: 9, offset: 0 })).resolves.toEqual({
        items: projects,
        count: 40,
        hasNext: true,
        hasPrevious: false,
      });
    });
  });

  describe('when the request fails', () => {
    it('propagates a 403 for an organisation the user cannot see', async () => {
      interceptList(() => HttpResponse.json({ detail: 'Forbidden' }, { status: 403 }));

      const error = await ProjectService.list({ limit: 9, offset: 0 }).catch(
        (reason: unknown) => reason
      );

      expect(isAxiosError(error) ? error.status : undefined).toBe(403);
    });

    it('propagates a server error', async () => {
      interceptList(() => HttpResponse.json({}, { status: 500 }));

      await expect(ProjectService.list({ limit: 9, offset: 0 })).rejects.toThrow('500');
    });
  });
});

describe('ProjectService.detail', () => {
  it('gets a single project by id', async () => {
    const project = buildProject({ id: 42 });

    server.use(http.get(detailUrl('42'), () => HttpResponse.json(project)));

    await expect(ProjectService.detail(42)).resolves.toEqual(project);
  });

  it('encodes an id that needs escaping', async () => {
    server.use(http.get(detailUrl('a%2Fb'), () => HttpResponse.json(buildProject())));

    await expect(ProjectService.detail('a/b')).resolves.toBeDefined();
  });

  it('propagates a 404 for a project that does not exist', async () => {
    server.use(http.get(detailUrl('9999'), () => HttpResponse.json({}, { status: 404 })));

    await expect(ProjectService.detail(9999)).rejects.toThrow('404');
  });
});

describe('ProjectService.list', () => {
  it('unwraps results into items and count', async () => {
    const projects = [buildProject(), buildProject()];

    interceptList(() => HttpResponse.json(buildDrfPage(projects, { count: 40 })));

    const page = await ProjectService.list({ limit: 9, offset: 0 });

    expect(page.items).toEqual(projects);
    expect(page.count).toBe(40);
  });

  it('reports hasNext from the next cursor', async () => {
    interceptList(() =>
      HttpResponse.json(
        buildDrfPage([buildProject()], { next: '/api/v3/projects?offset=9', previous: null })
      )
    );

    const page = await ProjectService.list({ limit: 9, offset: 0 });

    expect(page.hasNext).toBe(true);
    expect(page.hasPrevious).toBe(false);
  });

  it('returns an empty page when the backend sends no results', async () => {
    interceptList(() => HttpResponse.json(buildDrfPage([])));

    const page = await ProjectService.list({ limit: 9, offset: 0 });

    expect(page.items).toEqual([]);
    expect(page.count).toBe(0);
  });

  it('propagates a failure rather than returning an empty page', async () => {
    interceptList(() => HttpResponse.json({}, { status: 500 }));

    await expect(ProjectService.list({ limit: 9, offset: 0 })).rejects.toThrow('500');
  });
});
