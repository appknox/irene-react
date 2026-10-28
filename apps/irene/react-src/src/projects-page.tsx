import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { api } from './api';

/** A project, as the host hands one over. */
export interface Project {
  id: number;
  packageName: string;
  platform: string;
  fileCount: number;
}

/** A page of projects, as the API returns one. */
interface ProjectEnvelope {
  count: number;
  results: {
    id: number;
    package_name: string;
    platform: number;
    file_count: number;
  }[];
}

/** What the API's numeric platform means. */
const PLATFORM_NAMES: Record<number, string> = {
  0: 'Android',
  1: 'iOS',
  2: 'Windows',
};

/** How many projects a page shows. */
const PAGE_SIZE = 10;

/**
 * Reads a page of projects.
 *
 * @param params - The page size, offset and search text.
 * @returns The projects on the page and the total count.
 */
async function fetchProjects(params: { limit: number; offset: number; q: string }) {
  const { data } = await api.get<ProjectEnvelope>('api/v3/projects', {
    params: {
      limit: params.limit,
      offset: params.offset,
      ...(params.q ? { q: params.q } : {}),
    },
  });

  return {
    count: data.count,
    items: data.results.map((project) => ({
      id: project.id,
      packageName: project.package_name,
      platform: PLATFORM_NAMES[project.platform] ?? 'Unknown',
      fileCount: project.file_count,
    })),
  };
}

/**
 * The projects this account can open.
 *
 * Owns the whole screen: the records it reads, what is shown, what is being
 * waited for, the search and which page is open. The host renders it into an
 * element and supplies nothing else.
 */
export function ProjectsPage() {
  const [query, setQuery] = useState('');
  const [offset, setOffset] = useState(0);

  const {
    data: page = { items: [], count: 0 },
    isPending: isLoading,
    isError: hasFailed,
  } = useQuery({
    queryKey: ['projects', offset, query],
    queryFn: () => fetchProjects({ limit: PAGE_SIZE, offset, q: query }),

    /* The current page stays on screen while the next one is read. */
    placeholderData: keepPreviousData,
  });

  const lastOffset = Math.max(0, Math.ceil(page.count / PAGE_SIZE) - 1) * PAGE_SIZE;

  return (
    <section className="react-projects">
      <header className="react-projects__header">
        <h2 className="react-projects__title">
          {page.count} {page.count === 1 ? 'project' : 'projects'}
        </h2>

        <input
          className="react-projects__search"
          type="search"
          value={query}
          placeholder="Search by package name"
          aria-label="Search by package name"
          onChange={(event) => {
            setOffset(0);
            setQuery(event.target.value);
          }}
        />
      </header>

      {hasFailed && <p className="react-projects__status">The projects could not be loaded.</p>}

      {isLoading && !hasFailed && <p className="react-projects__status">Loading projects…</p>}

      {!isLoading && !hasFailed && page.items.length === 0 && (
        <p className="react-projects__status">No projects match that search.</p>
      )}

      {!isLoading && !hasFailed && page.items.length > 0 && (
        <ul className="react-projects__list">
          {page.items.map((project) => (
            <li key={project.id} className="react-projects__item">
              <span className="react-projects__name">{project.packageName}</span>

              <span className="react-projects__meta">
                {project.platform} · {project.fileCount} scans
              </span>
            </li>
          ))}
        </ul>
      )}

      <footer className="react-projects__footer">
        <button
          type="button"
          disabled={offset === 0 || isLoading}
          onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
        >
          Previous
        </button>

        <span>
          {Math.floor(offset / PAGE_SIZE) + 1} of {Math.max(1, Math.ceil(page.count / PAGE_SIZE))}
        </span>

        <button
          type="button"
          disabled={offset >= lastOffset || isLoading}
          onClick={() => setOffset(offset + PAGE_SIZE)}
        >
          Next
        </button>
      </footer>
    </section>
  );
}
