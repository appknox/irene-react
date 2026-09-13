import { describe, expect, it } from 'vitest';

import { API_NAMESPACES, buildUrl } from '@irene/api';

describe('buildUrl', () => {
  it('joins a namespace and a resource', () => {
    expect(buildUrl(API_NAMESPACES.v2, 'projects')).toBe('api/v2/projects');
  });

  it('collapses a leading slash on the resource', () => {
    expect(buildUrl(API_NAMESPACES.v2, '/projects')).toBe('api/v2/projects');
  });

  it('returns the namespace alone for an empty resource', () => {
    expect(buildUrl(API_NAMESPACES.v1, '')).toBe('api');
  });

  it('keeps nested resource paths intact', () => {
    expect(buildUrl(API_NAMESPACES.hudson, 'jobs/42/logs')).toBe('api/hudson-api/jobs/42/logs');
  });
});
